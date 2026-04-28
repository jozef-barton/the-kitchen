import { useCallback, useEffect, useRef, useState } from 'react';
import { Box } from '@chakra-ui/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// ── Streaming-aware message typewriter ────────────────────────────────────────
// Separate from the file-diff typewriter (useTypewriter.ts) — much slower,
// no jitter, pauses gracefully when it catches up to available streamed content.

const TEXT_CPS = 30; // characters per second — slow enough to read along

function useMessageTypewriter(
  text: string,
  isStreaming: boolean,
  enabled: boolean,
  onComplete: () => void,
) {
  const renderedRef = useRef(0);
  const rafRef = useRef(0);
  const doneRef = useRef(!enabled);
  const budgetRef = useRef(0);
  const lastTimeRef = useRef<number | null>(null);

  const [displayText, setDisplayText] = useState(enabled ? '' : text);
  const [isComplete, setIsComplete] = useState(!enabled);

  // Stable refs so rAF closure never goes stale
  const textRef = useRef(text);
  textRef.current = text;
  const isStreamingRef = useRef(isStreaming);
  isStreamingRef.current = isStreaming;
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const tick = useCallback((now: number) => {
    rafRef.current = 0;
    if (doneRef.current) return;

    const dt = lastTimeRef.current !== null
      ? Math.min((now - lastTimeRef.current) / 1000, 0.1)
      : 0;
    lastTimeRef.current = now;

    const t = textRef.current;
    budgetRef.current += dt * TEXT_CPS;

    while (budgetRef.current >= 1 && renderedRef.current < t.length) {
      renderedRef.current++;
      budgetRef.current -= 1;
    }

    setDisplayText(t.slice(0, renderedRef.current));

    if (renderedRef.current >= t.length) {
      if (!isStreamingRef.current) {
        doneRef.current = true;
        setIsComplete(true);
        onCompleteRef.current();
      } else {
        // Caught up to available content — pause, reset timing for resume
        lastTimeRef.current = null;
      }
    } else {
      rafRef.current = requestAnimationFrame(tick);
    }
  }, []); // empty deps — reads everything via refs

  // Start or resume rAF when text grows, or when streaming ends
  useEffect(() => {
    if (!enabled || doneRef.current) return;

    if (renderedRef.current < text.length) {
      // New content to type — ensure rAF is scheduled
      if (rafRef.current === 0) {
        rafRef.current = requestAnimationFrame(tick);
      }
    } else if (!isStreaming) {
      // Fully rendered and no more content coming — complete immediately
      doneRef.current = true;
      setDisplayText(text);
      setIsComplete(true);
      onCompleteRef.current();
    }
  }, [text, isStreaming, enabled, tick]);

  // Cancel rAF on unmount
  useEffect(() => () => { cancelAnimationFrame(rafRef.current); }, []);

  return { displayText, isComplete };
}

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  messageId: string;
  jobId: string;
  text: string;
  isStreaming?: boolean;
}

export function MessageRow({ messageId, jobId, text, isStreaming }: Props) {
  const sessionKey = `coding:animated:${jobId}:${messageId}`;
  const alreadyAnimated = typeof sessionStorage !== 'undefined'
    && sessionStorage.getItem(sessionKey) === '1';

  const { displayText, isComplete } = useMessageTypewriter(
    text,
    isStreaming ?? false,
    !alreadyAnimated,
    () => {
      try { sessionStorage.setItem(sessionKey, '1'); } catch { /* ignore */ }
    },
  );

  return (
    <Box className={`prose${!isComplete ? ' is-typing' : ''}`} px="2">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{displayText}</ReactMarkdown>
    </Box>
  );
}
