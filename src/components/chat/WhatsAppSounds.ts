// WhatsApp-style sound effects generated via Web Audio API
// No external files needed — all sounds are synthesized

const audioCtx = () => new (window.AudioContext || (window as any).webkitAudioContext)();

let ctx: AudioContext | null = null;
const getCtx = () => {
  if (!ctx || ctx.state === "closed") ctx = audioCtx();
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
};

/**
 * Incoming message — double-pop "plop" like WhatsApp
 */
export const playIncomingSound = () => {
  try {
    const c = getCtx();
    const now = c.currentTime;

    // First pop
    const osc1 = c.createOscillator();
    const gain1 = c.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(860, now);
    osc1.frequency.exponentialRampToValueAtTime(580, now + 0.08);
    gain1.gain.setValueAtTime(0.3, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    osc1.connect(gain1).connect(c.destination);
    osc1.start(now);
    osc1.stop(now + 0.12);

    // Second pop (slightly higher, quieter)
    const osc2 = c.createOscillator();
    const gain2 = c.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(1050, now + 0.08);
    osc2.frequency.exponentialRampToValueAtTime(750, now + 0.18);
    gain2.gain.setValueAtTime(0, now);
    gain2.gain.setValueAtTime(0.2, now + 0.08);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
    osc2.connect(gain2).connect(c.destination);
    osc2.start(now + 0.08);
    osc2.stop(now + 0.22);
  } catch { /* silently ignore */ }
};

/**
 * Outgoing message — short ascending "swoosh"
 */
export const playOutgoingSound = () => {
  try {
    const c = getCtx();
    const now = c.currentTime;

    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(400, now);
    osc.frequency.exponentialRampToValueAtTime(900, now + 0.06);
    osc.frequency.exponentialRampToValueAtTime(600, now + 0.1);
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    osc.connect(gain).connect(c.destination);
    osc.start(now);
    osc.stop(now + 0.1);
  } catch { /* silently ignore */ }
};

/**
 * Recording start — subtle "click"
 */
export const playRecordingStartSound = () => {
  try {
    const c = getCtx();
    const now = c.currentTime;

    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(1200, now);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
    osc.connect(gain).connect(c.destination);
    osc.start(now);
    osc.stop(now + 0.05);
  } catch { /* silently ignore */ }
};

/**
 * Recording stop — descending click
 */
export const playRecordingStopSound = () => {
  try {
    const c = getCtx();
    const now = c.currentTime;

    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(400, now + 0.06);
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
    osc.connect(gain).connect(c.destination);
    osc.start(now);
    osc.stop(now + 0.06);
  } catch { /* silently ignore */ }
};
