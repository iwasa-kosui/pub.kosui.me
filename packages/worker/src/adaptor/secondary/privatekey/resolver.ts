import { pipe } from 'fp-ts/function'
import * as T from 'fp-ts/Task'
import { SignKeyResolver } from '../../../domain'
import { AB } from '../../../helper/ab'

type RsaKey = (ArrayBuffer | ArrayBufferView) | JsonWebKey
const parsePem = (pem: string): RsaKey => {
  const pemHeader = '-----BEGIN PRIVATE KEY-----'
  const pemFooter = '-----END PRIVATE KEY-----'
  const trimmed = pem.trim().split('\n').join('').split('\\n').join('')
  return pipe(
    trimmed
      .substring(pemHeader.length, trimmed.length - pemFooter.length)
      .trim(),
    atob,
    AB.fromString,
  )
}

const parsePub = (pub: string): RsaKey => {
  const pubHeader = '-----BEGIN PUBLIC KEY-----'
  const pubFooter = '-----END PUBLIC KEY-----'
  const trimmed = pub.trim().split('\n').join('').split('\\n').join('')
  return pipe(
    trimmed
      .substring(pubHeader.length, trimmed.length - pubFooter.length)
      .trim(),
    atob,
    AB.fromString,
  )
}

const importSignKey =
  (subtle: SubtleCrypto) =>
  (key: RsaKey): T.Task<CryptoKey> =>
  () =>
    subtle.importKey(
      'pkcs8',
      key,
      {
        name: 'RSASSA-PKCS1-v1_5',
        hash: 'SHA-256',
      },
      true,
      ['sign'],
    )

const importVerifyKey =
  (subtle: SubtleCrypto) =>
  (key: RsaKey): T.Task<CryptoKey> =>
  () =>
    subtle.importKey(
      'spki',
      key,
      {
        name: 'RSASSA-PKCS1-v1_5',
        hash: 'SHA-256',
      },
      true,
      ['verify'],
    )

export const SignKeyResolverFactory = {
  new: (
    pem: string,
    subtle: SubtleCrypto = crypto.subtle,
  ): SignKeyResolver => ({
    resolve: (): T.Task<CryptoKey> =>
      pipe(pem, parsePem, importSignKey(subtle)),
  }),
}

export const VerifyKeyResolverFactory = {
  new: (
    pub: string,
    subtle: SubtleCrypto = crypto.subtle,
  ): SignKeyResolver => ({
    resolve: (): T.Task<CryptoKey> =>
      pipe(pub, parsePub, importVerifyKey(subtle)),
  }),
}
