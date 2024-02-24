import { pipe } from 'fp-ts/function'
import * as T from 'fp-ts/Task'
import { SignKeyResolver } from '../../../domain'
import { AB } from '../../../helper/ab'

type RsaKey = (ArrayBuffer | ArrayBufferView) | JsonWebKey
const parsePem = (pem: string): RsaKey => {
  const pemHeader = '-----BEGIN PRIVATE KEY-----'
  const pemFooter = '-----END PRIVATE KEY-----'
  return pipe(
    pem
      .substring(pemHeader.length, pem.length - pemFooter.length - 1)
      .split('\n')
      .join('')
      .split('\\n')
      .join('')
      .trim(),
    atob,
    AB.fromString,
  )
}

const importSignKey =
  (key: RsaKey): T.Task<CryptoKey> =>
  () =>
    crypto.subtle.importKey(
      'pkcs8',
      key,
      {
        name: 'RSASSA-PKCS1-v1_5',
        hash: 'SHA-256',
      },
      true,
      ['sign'],
    )

export const SignKeyResolverFactory = {
  new: (pem: string): SignKeyResolver => ({
    resolve: (): T.Task<CryptoKey> => pipe(pem, parsePem, importSignKey),
  }),
}
