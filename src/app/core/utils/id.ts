let fallbackCounter = 0;

export function createId(): string {
  const crypto = globalThis.crypto;

  if (crypto && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  fallbackCounter += 1;
  return `id-${Date.now().toString(36)}-${fallbackCounter.toString(36)}`;
}
