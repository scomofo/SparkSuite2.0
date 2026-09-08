/** A format check only; OpenAI validates the credential when the learner asks. */
export function normalizeCoachKey(value: string): string | null {
  const key = value.trim();
  return /^sk-[A-Za-z0-9_-]{20,509}$/.test(key) ? key : null;
}

/** Personal credentials require HTTPS, with loopback HTTP allowed for development. */
export function isCoachKeyTransportSecure(value: string): boolean {
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" ||
      (url.protocol === "http:" && ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname))
    );
  } catch {
    return false;
  }
}
