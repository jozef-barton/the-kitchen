export type StructuredJsonFailureKind =
  | 'empty_payload'
  | 'json_missing'
  | 'json_unbalanced'
  | 'json_invalid'
  | 'json_root_not_object';

export type StructuredJsonRecoveryStrategy = 'extract_first_json_object' | 'complete_trailing_delimiters';

export type StructuredJsonRecoveryFailure = {
  strategy: StructuredJsonRecoveryStrategy;
  detail: string;
};

export type StructuredJsonRecoveryDiagnostics = {
  responseBeginsWithJson: boolean;
  containsJsonStart: boolean;
  balancedJsonFound: boolean;
  leadingProse: boolean;
  trailingProse: boolean;
  jsonParseAttempted: boolean;
  jsonParseSucceeded: boolean;
  changedPayload: boolean;
  recoveryAttempted: boolean;
  recoverySucceeded: boolean;
  recoveryStrategiesAttempted: StructuredJsonRecoveryStrategy[];
  recoveryStrategiesSucceeded: StructuredJsonRecoveryStrategy[];
  recoveryStrategiesFailed: StructuredJsonRecoveryFailure[];
};

export type StructuredJsonExtractionResult = {
  rawValue: unknown | null;
  jsonText: string | null;
  errors: string[];
  warnings: string[];
  failureKind: StructuredJsonFailureKind | null;
  recovered: boolean;
  changedPayload: boolean;
  leadingText: string;
  trailingText: string;
  diagnostics: StructuredJsonRecoveryDiagnostics;
};

type JsonCandidateExtraction =
  | {
      status: 'balanced';
      jsonText: string;
      leadingText: string;
      trailingText: string;
    }
  | {
      status: 'completed';
      jsonText: string;
      leadingText: string;
      trailingText: string;
    }
  | {
      status: 'failed';
      failureKind: Extract<StructuredJsonFailureKind, 'json_missing' | 'json_unbalanced' | 'json_invalid'>;
      detail: string;
      leadingText: string;
      trailingText: string;
    };

function createDiagnostics(trimmed: string): StructuredJsonRecoveryDiagnostics {
  return {
    responseBeginsWithJson: trimmed.startsWith('{') || trimmed.startsWith('['),
    containsJsonStart: trimmed.search(/[[{]/u) >= 0,
    balancedJsonFound: false,
    leadingProse: false,
    trailingProse: false,
    jsonParseAttempted: false,
    jsonParseSucceeded: false,
    changedPayload: false,
    recoveryAttempted: false,
    recoverySucceeded: false,
    recoveryStrategiesAttempted: [],
    recoveryStrategiesSucceeded: [],
    recoveryStrategiesFailed: []
  };
}

function appendTrailingClosers(stack: string[]) {
  return stack
    .slice()
    .reverse()
    .map((entry) => (entry === '{' ? '}' : ']'))
    .join('');
}

function extractJsonCandidate(text: string, diagnostics: StructuredJsonRecoveryDiagnostics): JsonCandidateExtraction {
  const startIndex = text.search(/[[{]/u);
  if (startIndex < 0) {
    return {
      status: 'failed',
      failureKind: 'json_missing',
      detail: 'The response did not contain a JSON object.',
      leadingText: '',
      trailingText: ''
    };
  }

  const leadingText = text.slice(0, startIndex).trim();
  const stack: string[] = [];
  let inString = false;
  let escaped = false;

  for (let index = startIndex; index < text.length; index += 1) {
    const character = text[index];
    if (!character) {
      continue;
    }

    if (escaped) {
      escaped = false;
      continue;
    }

    if (character === '\\') {
      escaped = true;
      continue;
    }

    if (character === '"') {
      inString = !inString;
      continue;
    }

    if (inString) {
      continue;
    }

    if (character === '{' || character === '[') {
      stack.push(character);
      continue;
    }

    if (character === '}' || character === ']') {
      const expected = character === '}' ? '{' : '[';
      if (stack.at(-1) !== expected) {
        return {
          status: 'failed',
          failureKind: 'json_invalid',
          detail: 'The response contained mismatched JSON closing delimiters.',
          leadingText,
          trailingText: text.slice(index + 1).trim()
        };
      }

      stack.pop();
      if (stack.length === 0) {
        diagnostics.balancedJsonFound = true;
        return {
          status: 'balanced',
          jsonText: text.slice(startIndex, index + 1),
          leadingText,
          trailingText: text.slice(index + 1).trim()
        };
      }
    }
  }

  if (inString) {
    return {
      status: 'failed',
      failureKind: 'json_invalid',
      detail: 'The response ended inside a JSON string and could not be recovered deterministically.',
      leadingText,
      trailingText: ''
    };
  }

  if (stack.length === 0) {
    return {
      status: 'failed',
      failureKind: 'json_missing',
      detail: 'The response did not contain a usable JSON object.',
      leadingText,
      trailingText: ''
    };
  }

  diagnostics.recoveryAttempted = true;
  diagnostics.recoveryStrategiesAttempted.push('complete_trailing_delimiters');
  const completedJson = `${text.slice(startIndex)}${appendTrailingClosers(stack)}`;
  return {
    status: 'completed',
    jsonText: completedJson,
    leadingText,
    trailingText: ''
  };
}

/**
 * Attempt to parse a partial/truncated JSON string produced by a streaming LLM.
 *
 * Uses the existing `complete_trailing_delimiters` strategy from `extractJsonCandidate`: it finds
 * the first `{`, walks balanced braces/brackets, then closes any open ones.  Strings that end
 * inside a quoted value are rejected (non-deterministic completion) and return null.
 *
 * Returns the parsed object on success, or null if the chunk is too short / unparseable.
 * Never throws.
 */
export function parsePartialJsonObject(raw: string): Record<string, unknown> | null {
  if (!raw || raw.trim().length < 2) return null;
  const result = extractRecoverableJsonObject(raw, { requireObject: true });
  if (result.rawValue !== null && typeof result.rawValue === 'object' && !Array.isArray(result.rawValue)) {
    return result.rawValue as Record<string, unknown>;
  }
  return null;
}

export function extractRecoverableJsonObject(
  responseText: string,
  options: {
    requireObject?: boolean;
  } = {}
): StructuredJsonExtractionResult {
  const trimmed = responseText.trim();
  const requireObject = options.requireObject ?? true;
  const diagnostics = createDiagnostics(trimmed);

  if (!trimmed) {
    return {
      rawValue: null,
      jsonText: null,
      errors: ['The response was empty.'],
      warnings: [],
      failureKind: 'empty_payload',
      recovered: false,
      changedPayload: false,
      leadingText: '',
      trailingText: '',
      diagnostics
    };
  }

  const extracted = extractJsonCandidate(trimmed, diagnostics);
  if (extracted.status === 'failed') {
    if (diagnostics.recoveryStrategiesAttempted.includes('complete_trailing_delimiters')) {
      diagnostics.recoveryStrategiesFailed.push({
        strategy: 'complete_trailing_delimiters',
        detail: extracted.detail
      });
    }
    diagnostics.leadingProse = extracted.leadingText.length > 0;
    diagnostics.trailingProse = extracted.trailingText.length > 0;
    return {
      rawValue: null,
      jsonText: null,
      errors: [extracted.detail],
      warnings: [],
      failureKind: extracted.failureKind,
      recovered: false,
      changedPayload: false,
      leadingText: extracted.leadingText,
      trailingText: extracted.trailingText,
      diagnostics
    };
  }

  diagnostics.leadingProse = extracted.leadingText.length > 0;
  diagnostics.trailingProse = extracted.trailingText.length > 0;
  const changedPayload =
    extracted.status === 'completed' || diagnostics.leadingProse || diagnostics.trailingProse;
  diagnostics.changedPayload = changedPayload;
  const warnings: string[] = [];

  if (diagnostics.leadingProse || diagnostics.trailingProse) {
    diagnostics.recoveryAttempted = true;
    diagnostics.recoverySucceeded = true;
    diagnostics.recoveryStrategiesAttempted.push('extract_first_json_object');
    diagnostics.recoveryStrategiesSucceeded.push('extract_first_json_object');
    warnings.push('Ignored non-JSON prose before or after the first JSON object.');
  }

  if (extracted.status === 'completed') {
    diagnostics.recoverySucceeded = true;
    diagnostics.recoveryStrategiesSucceeded.push('complete_trailing_delimiters');
    warnings.push('Recovered missing trailing JSON closing delimiters by deterministic balance completion.');
  }

  diagnostics.jsonParseAttempted = true;
  try {
    const parsed = JSON.parse(extracted.jsonText) as unknown;
    diagnostics.jsonParseSucceeded = true;
    if (requireObject && (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed))) {
      return {
        rawValue: null,
        jsonText: extracted.jsonText,
        errors: ['The response must be a single JSON object.'],
        warnings,
        failureKind: 'json_root_not_object',
        recovered: changedPayload,
        changedPayload,
        leadingText: extracted.leadingText,
        trailingText: extracted.trailingText,
        diagnostics
      };
    }

    return {
      rawValue: parsed,
      jsonText: extracted.jsonText,
      errors: [],
      warnings,
      failureKind: null,
      recovered: changedPayload,
      changedPayload,
      leadingText: extracted.leadingText,
      trailingText: extracted.trailingText,
      diagnostics
    };
  } catch (error) {
    if (extracted.status === 'completed') {
      diagnostics.recoveryStrategiesFailed.push({
        strategy: 'complete_trailing_delimiters',
        detail: error instanceof Error ? error.message : 'The completed JSON payload still failed to parse.'
      });
      diagnostics.recoverySucceeded = diagnostics.recoveryStrategiesSucceeded.length > 0;
    }
    return {
      rawValue: null,
      jsonText: extracted.jsonText,
      errors: [error instanceof Error ? error.message : 'The response was not valid JSON.'],
      warnings,
      failureKind: 'json_invalid',
      recovered: false,
      changedPayload,
      leadingText: extracted.leadingText,
      trailingText: extracted.trailingText,
      diagnostics
    };
  }
}
