import { useCallback, useEffect, useRef, useState } from 'react';
import { Box } from '@chakra-ui/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// ── Streaming-aware message typewriter ────────────────────────────────────────

const TEXT_CPS = 30; // characters/second — slow enough to read along

function useMessageTypewriter(
  text: string,
  isStreaming: boolean,
  /** Determined ONCE at mount — must never change between renders */
  shouldAnimate: boolean,
  onSeen: () => void,
) {
  const renderedRef = useRef(0);
  const rafRef = useRef(0);
  // doneRef starts true when we're not animating so the effect is always a no-op
  const doneRef = useRef(!shouldAnimate);
  const budgetRef = useRef(0);
  const lastTimeRef = useRef<number | null>(null);

  const [displayText, setDisplayText] = useState(shouldAnimate ? '' : text);
  const [isComplete, setIsComplete] = useState(!shouldAnimate);

  // Stable refs — rAF closure reads these every frame without stale values
  const textRef = useRef(text);
  textRef.current = text;
  const isStreamingRef = useRef(isStreaming);
  isStreamingRef.current = isStreaming;
  const onSeenRef = useRef(onSeen);
  onSeenRef.current = onSeen;

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
        onSeenRef.current();
      } else {
        // Caught up to available content — pause and reset timing for resume
        lastTimeRef.current = null;
      }
    } else {
      rafRef.current = requestAnimationFrame(tick);
    }
  }, []); // empty — reads all mutable state via refs

  // Start/resume the rAF when text grows or when streaming ends.
  // `shouldAnimate` is intentionally excluded from deps — it's stable at mount.
  useEffect(() => {
    if (!shouldAnimate || doneRef.current) return;

    if (renderedRef.current < text.length) {
      if (!isStreaming) {
        // Streaming already ended — snap to full text instead of slow-typing through it.
        cancelAnimationFrame(rafRef.current);
        rafRef.current = 0;
        doneRef.current = true;
        renderedRef.current = text.length;
        setDisplayText(text);
        setIsComplete(true);
        onSeenRef.current();
      } else if (rafRef.current === 0) {
        rafRef.current = requestAnimationFrame(tick);
      }
    } else if (!isStreaming) {
      doneRef.current = true;
      setDisplayText(text);
      setIsComplete(true);
      onSeenRef.current();
    }
  }, [text, isStreaming, tick, shouldAnimate]);

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

  // Determine once at mount whether this message should animate.
  // Using a ref ensures this never flips between renders (avoiding the bug where
  // sessionStorage is set post-mount and `enabled` would flip to false mid-animation).
  const shouldAnimateRef = useRef<boolean | null>(null);
  if (shouldAnimateRef.current === null) {
    shouldAnimateRef.current = typeof sessionStorage === 'undefined'
      ? false
      : sessionStorage.getItem(sessionKey) !== '1';
  }
  const shouldAnimate = shouldAnimateRef.current;

  // Mark as seen immediately — don't wait for animation to fully complete.
  // This means navigating away mid-animation and returning shows content instantly.
  useEffect(() => {
    if (shouldAnimate) {
      try { sessionStorage.setItem(sessionKey, '1'); } catch { /* ignore */ }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const { displayText, isComplete } = useMessageTypewriter(
    text,
    isStreaming ?? false,
    shouldAnimate,
    () => { /* sessionStorage already written above */ },
  );

  return (
    <Box className={`prose${!isComplete ? ' is-typing' : ''}`} px="2">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{displayText}</ReactMarkdown>
    </Box>
  );
}
