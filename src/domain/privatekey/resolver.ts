import type * as T from 'fp-ts/Task'

export type SignKeyResolver = {
  resolve: () => T.Task<CryptoKey>
}
