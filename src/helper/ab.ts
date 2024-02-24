export const AB = {
  fromString: (s: string): ArrayBuffer => Uint8Array.from(s, (c) => c.charCodeAt(0)),
  toString: (a: ArrayBuffer) => String.fromCharCode(...new Uint8Array(a)),
} as const
