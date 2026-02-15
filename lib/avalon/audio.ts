// Singleton AudioContext manager for reliable sound playback.
// Browsers block AudioContext.resume() unless triggered by a user gesture,
// so we create the context lazily on the first user tap, then reuse it.

let ctx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!ctx) {
    ctx = new (window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext)();
  }
  // resume() is a no-op if already running, but required once after creation
  if (ctx.state === "suspended") {
    ctx.resume();
  }
  return ctx;
}

/**
 * Must be called inside a click / touchstart handler at least once
 * so the browser unlocks the AudioContext.
 */
export function unlockAudio() {
  const c = getCtx();
  if (c.state === "suspended") {
    c.resume();
  }
  // Play a silent buffer to fully unlock on iOS Safari
  const buf = c.createBuffer(1, 1, 22050);
  const src = c.createBufferSource();
  src.buffer = buf;
  src.connect(c.destination);
  src.start(0);
}

/** Short tick for countdown (last 10 seconds) */
export function playTick() {
  try {
    const c = getCtx();
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.connect(gain);
    gain.connect(c.destination);
    osc.frequency.value = 600;
    osc.type = "sine";
    const now = c.currentTime;
    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    osc.start(now);
    osc.stop(now + 0.08);
  } catch {
    /* ignore */
  }
}

/** Three-beep alert when time runs out */
export function playAlert() {
  try {
    const c = getCtx();

    const beep = (start: number, freq: number, dur: number) => {
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.connect(gain);
      gain.connect(c.destination);
      osc.frequency.value = freq;
      osc.type = "square";
      gain.gain.setValueAtTime(0.35, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + dur);
      osc.start(start);
      osc.stop(start + dur);
    };

    const now = c.currentTime;
    beep(now, 880, 0.2);
    beep(now + 0.28, 880, 0.2);
    beep(now + 0.56, 1100, 0.4);
  } catch {
    /* ignore */
  }
}
