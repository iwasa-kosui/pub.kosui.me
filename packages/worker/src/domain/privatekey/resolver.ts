import type * as T from 'fp-ts/Task'

export type SignKeyResolver = {
  resolve: () => T.Task<CryptoKey>
}
export type VerifyKeyResolver = {
  resolve: () => T.Task<CryptoKey>
}
