import { useCallback, useEffect, useRef, useState } from 'react';

// ── Tunable constants — adjust from one place ──────────────────────────────────
export const TYPEWRITER_CONFIG = {
  BASE_CHARS_PER_SECOND: 350,     // fast AI-generation feel
  JITTER: 0.3,                    // ±30% per frame → choppy but readable
  LINE_PAUSE_CHARS: 1,            // tiny pause at newlines
  SECTION_PAUSE_CHARS: 3,         // slightly longer at blank lines
  ACCELERATE_AFTER_S: 4,          // ramp up after 4s for large files
  ACCELERATION_FACTOR: 2.0,       // aggressive ramp
  MIN_DURATION_MS: 250,           // minimum animation time
} as const;

interface UseTypewriterOptions {
  /** The full text to type out. */
  text: string;
  /** If false, immediately returns the full text with isComplete=true. */
  enabled: boolean;
  /** Delay before typing starts (ms). Default 0. */
  delayMs?: number;
  onComplete?: () => void;
}

interface UseTypewriterResult {
  displayText: string;
  isComplete: boolean;
  /** Instantly jump to full text and fire onComplete. */
  skip: () => void;
}

export function useTypewriter({ text, enabled, delayMs = 0, onComplete }: UseTypewriterOptions): UseTypewriterResult {
  const [displayText, setDisplayText] = useState<string>(enabled ? '' : text);
  const [isComplete, setIsComplete] = useState<boolean>(!enabled);

  const cancelledRef = useRef(false);
  const rafRef = useRef<number>(0);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    if (!enabled) {
      setDisplayText(text);
      setIsComplete(true);
      return;
    }

    cancelledRef.current = false;
    let charsRendered = 0;
    let charBudget = 0;
    let charsPerSecond = TYPEWRITER_CONFIG.BASE_CHARS_PER_SECOND;
    let lastFrameTime: number | null = null;
    const startWall = performance.now() + delayMs;
    let typingStartTime: number | null = null;

    function frame(now: number) {
      if (cancelledRef.current) return;

      // Wait out the initial delay
      if (now < startWall) {
        rafRef.current = requestAnimationFrame(frame);
        return;
      }

      if (typingStartTime === null) {
        typingStartTime = now;
        lastFrameTime = now;
      }

      const dt = Math.min((now - lastFrameTime!) / 1000, 0.1); // cap dt so a bg-tab stall doesn't dump a wall of text
      lastFrameTime = now;

      // Dynamic acceleration after the cap
      const elapsed = (now - typingStartTime) / 1000;
      if (elapsed > TYPEWRITER_CONFIG.ACCELERATE_AFTER_S) {
        const overshoot = elapsed - TYPEWRITER_CONFIG.ACCELERATE_AFTER_S;
        charsPerSecond = TYPEWRITER_CONFIG.BASE_CHARS_PER_SECOND *
          Math.pow(TYPEWRITER_CONFIG.ACCELERATION_FACTOR, Math.floor(overshoot));
      }

      // Random jitter makes it feel organic rather than mechanical
      const jitter = 1 - TYPEWRITER_CONFIG.JITTER + Math.random() * TYPEWRITER_CONFIG.JITTER * 2;
      charBudget += dt * charsPerSecond * jitter;

      while (charBudget >= 1 && charsRendered < text.length) {
        const ch = text[charsRendered];
        charsRendered++;
        charBudget -= 1;

        if (ch === '\n') {
          // Pause at line breaks; longer pause at paragraph breaks (double newline)
          const nextCh = text[charsRendered];
          charBudget -= nextCh === '\n'
            ? TYPEWRITER_CONFIG.SECTION_PAUSE_CHARS
            : TYPEWRITER_CONFIG.LINE_PAUSE_CHARS;
        }
      }

      setDisplayText(text.slice(0, charsRendered));

      if (charsRendered >= text.length) {
        // Enforce minimum duration for very short texts
        const totalElapsed = now - startWall;
        const remaining = TYPEWRITER_CONFIG.MIN_DURATION_MS - totalElapsed;
        if (remaining > 0 && text.length < 80) {
          setTimeout(() => {
            if (!cancelledRef.current) {
              setIsComplete(true);
              onCompleteRef.current?.();
            }
          }, remaining);
        } else {
          setIsComplete(true);
          onCompleteRef.current?.();
        }
        return;
      }

      rafRef.current = requestAnimationFrame(frame);
    }

    rafRef.current = requestAnimationFrame(frame);

    return () => {
      cancelledRef.current = true;
      cancelAnimationFrame(rafRef.current);
    };
  }, [text, enabled, delayMs]);

  const skip = useCallback(() => {
    cancelledRef.current = true;
    cancelAnimationFrame(rafRef.current);
    setDisplayText(text);
    setIsComplete(true);
    onCompleteRef.current?.();
  }, [text]);

  return { displayText, isComplete, skip };
}
