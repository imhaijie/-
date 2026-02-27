// Singleton AudioContext manager for reliable sound playback.
// Browsers block AudioContext.resume() unless triggered by a user gesture,
// so we create the context lazily on the first user tap, then reuse it.

let ctx: AudioContext | null = null;
let audioPermissionGranted = false;
let notificationPermissionGranted = false;

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
 * Check if audio permission has been granted
 */
export function isAudioUnlocked(): boolean {
  return audioPermissionGranted;
}

/**
 * Check if notification permission has been granted
 */
export function isNotificationGranted(): boolean {
  return notificationPermissionGranted;
}

/**
 * Request notification permission
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!("Notification" in window)) {
    return false;
  }
  
  if (Notification.permission === "granted") {
    notificationPermissionGranted = true;
    return true;
  }
  
  if (Notification.permission !== "denied") {
    const permission = await Notification.requestPermission();
    notificationPermissionGranted = permission === "granted";
    return notificationPermissionGranted;
  }
  
  return false;
}

/**
 * Show a notification
 */
export function showNotification(title: string, body?: string) {
  if (notificationPermissionGranted && "Notification" in window) {
    new Notification(title, { body, icon: "/favicon.ico" });
  }
}

/**
 * Must be called inside a click / touchstart handler at least once
 * so the browser unlocks the AudioContext.
 * Returns true if audio was successfully unlocked.
 */
export function unlockAudio(): boolean {
  try {
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
    audioPermissionGranted = true;
    return true;
  } catch {
    return false;
  }
}

/**
 * Request all necessary permissions for the game
 * Must be called from a user gesture (click/tap)
 */
export async function requestAllPermissions(): Promise<{
  audio: boolean;
  notification: boolean;
}> {
  const audio = unlockAudio();
  const notification = await requestNotificationPermission();
  return { audio, notification };
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

    const beep = (start: number, freq: number, dur: number, volume = 0.35) => {
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.connect(gain);
      gain.connect(c.destination);
      osc.frequency.value = freq;
      osc.type = "square";
      gain.gain.setValueAtTime(volume, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + dur);
      osc.start(start);
      osc.stop(start + dur);
    };

    const now = c.currentTime;
    // Louder and more noticeable alert pattern
    beep(now, 880, 0.25, 0.5);
    beep(now + 0.35, 880, 0.25, 0.5);
    beep(now + 0.7, 1100, 0.5, 0.6);
    
    // Also show a notification if permitted
    showNotification("发言时间到！", "请切换到下一位玩家发言");
  } catch {
    /* ignore */
  }
}

/** Play success sound */
export function playSuccess() {
  try {
    const c = getCtx();
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.connect(gain);
    gain.connect(c.destination);
    osc.frequency.value = 523.25; // C5
    osc.type = "sine";
    const now = c.currentTime;
    gain.gain.setValueAtTime(0.3, now);
    osc.start(now);
    osc.frequency.setValueAtTime(659.25, now + 0.1); // E5
    osc.frequency.setValueAtTime(783.99, now + 0.2); // G5
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
    osc.stop(now + 0.4);
  } catch {
    /* ignore */
  }
}

/** Play error/fail sound */
export function playError() {
  try {
    const c = getCtx();
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.connect(gain);
    gain.connect(c.destination);
    osc.frequency.value = 200;
    osc.type = "sawtooth";
    const now = c.currentTime;
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    osc.start(now);
    osc.stop(now + 0.3);
  } catch {
    /* ignore */
  }
}
