export function getGuidedAudioUrl(src, baseUrl = import.meta.env.BASE_URL) {
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  return `${normalizedBase}${src.replace(/^\//, "")}`;
}

export function createGuidedAudioPool({
  createAudio = (url) => new Audio(url),
  baseUrl = import.meta.env.BASE_URL,
  releaseDelay = 48,
} = {}) {
  const entries = new Map();

  const prepare = (src, volume) => {
    let entry = entries.get(src);
    if (!entry) {
      const element = createAudio(getGuidedAudioUrl(src, baseUrl));
      element.preload = "auto";
      entry = { src, element, playPromise: null, users: 0, releaseTimer: null };
      entries.set(src, entry);
      element.load?.();
    }
    entry.element.volume = volume;
    return entry;
  };

  const reset = (src, volume) => {
    const entry = prepare(src, volume);
    entry.element.pause?.();
    try { entry.element.currentTime = 0; } catch {}
    entry.playPromise = null;
    if ((entry.element.readyState ?? 0) < 3) entry.element.load?.();
    return entry;
  };

  const prime = (src, volume) => {
    const entry = prepare(src, volume);
    entry.playPromise = entry.element.play();
    entry.playPromise.catch(() => {});
    return entry;
  };

  const attach = (src, volume) => {
    const entry = prepare(src, volume);
    clearTimeout(entry.releaseTimer);
    entry.releaseTimer = null;
    entry.users += 1;
    return entry;
  };

  const detach = (entry) => {
    entry.users = Math.max(0, entry.users - 1);
    clearTimeout(entry.releaseTimer);
    if (entry.users > 0) return;
    entry.releaseTimer = setTimeout(() => {
      if (entry.users > 0) return;
      entry.element.pause?.();
      entry.playPromise = null;
    }, releaseDelay);
  };

  return { prepare, reset, prime, attach, detach };
}

export const guidedAudioPool = createGuidedAudioPool();
