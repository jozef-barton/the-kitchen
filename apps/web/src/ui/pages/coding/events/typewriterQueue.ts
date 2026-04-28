// Module-level FIFO queue — one drawer animates at a time.

type StartFn = () => void;

const waiters: StartFn[] = [];
let running = false;

function drain() {
  if (running || waiters.length === 0) return;
  running = true;
  waiters.shift()!();
}

/**
 * Register to animate. Returns a cancel/cleanup fn.
 * If the callback has already fired (animation started) and the component then
 * unmounts (StrictMode double-mount, or user navigation), the cleanup MUST release
 * the queue so the re-mount can enqueue successfully.
 */
export function enqueueAnimation(onTurn: StartFn): () => void {
  let fired = false;
  const wrapped = () => {
    fired = true;
    onTurn();
  };
  waiters.push(wrapped);
  drain();
  return () => {
    if (!fired) {
      // Not yet dispatched — just remove from the wait list
      const i = waiters.indexOf(wrapped);
      if (i >= 0) waiters.splice(i, 1);
    } else {
      // Already dispatched but component is unmounting (StrictMode re-mount or navigation).
      // Release the lock so the next enqueue can run.
      running = false;
      drain();
    }
  };
}

/** Call when the running animation fully completes or is cancelled by the user. */
export function animationDone() {
  running = false;
  drain();
}
