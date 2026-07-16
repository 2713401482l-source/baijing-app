const interactionProfiles = {
  soft: { frequency: 560, overtone: 1.5, type: "sine", duration: 0.075, peak: 0.07 },
  selection: { frequency: 660, overtone: 1.25, type: "triangle", duration: 0.085, peak: 0.082 },
  confirm: { frequency: 760, overtone: 1.5, type: "triangle", duration: 0.11, peak: 0.095 },
};

export const railProfiles = [
  { frequency: 392, overtone: 1.5, type: "sine", duration: 0.105, peak: 0.086 },
  { frequency: 440, overtone: 1.25, type: "triangle", duration: 0.095, peak: 0.082 },
  { frequency: 523.25, overtone: 1.125, type: "triangle", duration: 0.08, peak: 0.078 },
  { frequency: 293.66, overtone: 1.5, type: "sine", duration: 0.115, peak: 0.088 },
  { frequency: 349.23, overtone: 1.25, type: "sine", duration: 0.125, peak: 0.09 },
  { frequency: 261.63, overtone: 2, type: "sine", duration: 0.14, peak: 0.092 },
];

export function clampVolume(value, fallback = 0.82) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(1, Math.max(0, number));
}

let context;
let output;
const htmlTonePools = new Map();

export function isSamsungBrowser(userAgent = typeof navigator === "undefined" ? "" : navigator.userAgent) {
  return /SamsungBrowser\//i.test(userAgent);
}

function writeAscii(view, offset, value) {
  for (let index = 0; index < value.length; index += 1) view.setUint8(offset + index, value.charCodeAt(index));
}

function createToneDataUrl(profile) {
  const sampleRate = 22050;
  const sampleCount = Math.ceil(sampleRate * (profile.duration + 0.018));
  const buffer = new ArrayBuffer(44 + sampleCount * 2);
  const view = new DataView(buffer);
  writeAscii(view, 0, "RIFF");
  view.setUint32(4, 36 + sampleCount * 2, true);
  writeAscii(view, 8, "WAVEfmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeAscii(view, 36, "data");
  view.setUint32(40, sampleCount * 2, true);
  const attack = 0.012;
  for (let index = 0; index < sampleCount; index += 1) {
    const time = index / sampleRate;
    const fadeIn = Math.min(1, time / attack);
    const fadeOut = Math.max(0, 1 - time / profile.duration);
    const envelope = fadeIn * fadeOut * fadeOut;
    const fundamental = Math.sin(2 * Math.PI * profile.frequency * time);
    const overtone = Math.sin(2 * Math.PI * profile.frequency * profile.overtone * time) * 0.28;
    const amplitude = Math.min(0.48, profile.peak * 4.6);
    view.setInt16(44 + index * 2, Math.round((fundamental + overtone) / 1.28 * envelope * amplitude * 32767), true);
  }
  let binary = "";
  const bytes = new Uint8Array(buffer);
  for (let offset = 0; offset < bytes.length; offset += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
  }
  return `data:audio/wav;base64,${btoa(binary)}`;
}

function prepareHtmlTone(profile) {
  if (typeof Audio === "undefined") return null;
  if (!htmlTonePools.has(profile)) {
    const url = createToneDataUrl(profile);
    htmlTonePools.set(profile, {
      cursor: 0,
      players: Array.from({ length: 3 }, () => {
        const audio = new Audio(url);
        audio.preload = "auto";
        audio.setAttribute?.("playsinline", "");
        return audio;
      }),
    });
  }
  return htmlTonePools.get(profile);
}

async function playHtmlTone(profile, volume) {
  const pool = prepareHtmlTone(profile);
  if (!pool) return false;
  const audio = pool.players[pool.cursor % pool.players.length];
  pool.cursor += 1;
  audio.volume = clampVolume(volume);
  try {
    audio.currentTime = 0;
    await audio.play();
    return true;
  } catch {
    return false;
  }
}

function createOutput(audioContext) {
  const master = audioContext.createGain();
  const compressor = audioContext.createDynamicsCompressor?.();
  master.gain.value = 1;
  if (compressor) {
    compressor.threshold.value = -20;
    compressor.knee.value = 12;
    compressor.ratio.value = 4;
    compressor.attack.value = 0.003;
    compressor.release.value = 0.14;
    master.connect(compressor).connect(audioContext.destination);
  } else {
    master.connect(audioContext.destination);
  }
  return master;
}

function getContext() {
  if (typeof window === "undefined") return null;
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return null;
  if (!context || context.state === "closed") {
    context = new AudioContextClass({ latencyHint: "interactive" });
    output = createOutput(context);
  }
  return context;
}

export async function unlockFeedbackAudio() {
  if (isSamsungBrowser()) {
    Object.values(interactionProfiles).forEach(prepareHtmlTone);
    railProfiles.forEach(prepareHtmlTone);
    return true;
  }
  const audioContext = getContext();
  if (!audioContext) return false;
  try {
    if (audioContext.state !== "running") await audioContext.resume();
    if (audioContext.state !== "running") return false;
    const buffer = audioContext.createBuffer(1, 1, audioContext.sampleRate);
    const source = audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(output);
    source.start();
    return true;
  } catch {
    return false;
  }
}

async function playProfile(profile, volume) {
  if (isSamsungBrowser()) return playHtmlTone(profile, volume);
  const audioContext = getContext();
  if (!audioContext) return false;
  if (audioContext.state !== "running" && !(await unlockFeedbackAudio())) return false;
  const now = audioContext.currentTime;
  const level = profile.peak * clampVolume(volume);
  const gain = audioContext.createGain();
  const primary = audioContext.createOscillator();
  const overtone = audioContext.createOscillator();
  primary.type = profile.type;
  overtone.type = "sine";
  primary.frequency.setValueAtTime(profile.frequency, now);
  overtone.frequency.setValueAtTime(profile.frequency * profile.overtone, now);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, level), now + 0.009);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + profile.duration);
  primary.connect(gain);
  overtone.connect(gain);
  gain.connect(output);
  primary.start(now);
  overtone.start(now);
  primary.stop(now + profile.duration + 0.02);
  overtone.stop(now + profile.duration + 0.02);
  return true;
}

export function playInteractionFeedback(kind = "soft", volume) {
  return playProfile(interactionProfiles[kind] ?? interactionProfiles.soft, volume);
}

export function playRailFeedback(index, volume) {
  return playProfile(railProfiles[index] ?? railProfiles[0], volume);
}

export function getFeedbackAudioState() {
  return context?.state ?? "uninitialized";
}
