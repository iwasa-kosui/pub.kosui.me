import * as T from 'fp-ts/Task'
import { flow, pipe } from 'fp-ts/function'
import { Activity, ActivityStore } from './../../../domain'
import { fetchAsTask } from '../helper/fetchAsTask'

const AB = {
  fromString: (s: string): ArrayBuffer => Uint8Array.from(s, (c) => c.charCodeAt(0)),
  toString: (a: ArrayBuffer) => String.fromCharCode(...new Uint8Array(a)),
} as const

const toDigest = (body: string): T.Task<string> =>
  pipe(
    new TextEncoder().encode(body),
    (encoded) => () => crypto.subtle.digest('SHA-256', encoded),
    T.map(flow(AB.toString, btoa, (sha) => `SHA-256=${sha}`)),
  )

const sign =
  (key: CryptoKey) =>
  (data: string): T.Task<string> =>
    pipe(
      T.of(data),
      T.map(AB.fromString),
      T.flatMap((data) => () => crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, data)),
      T.map(AB.toString),
      T.map(btoa),
    )

export const signActivity =
  (key: CryptoKey) =>
  (digest: string, inbox: URL, now: Date): T.Task<string> =>
    pipe(
      T.of(
        [`(request-target): post ${inbox.pathname}`, `host: ${inbox.hostname}`, `date: ${now.toUTCString()}`, `digest: ${digest}`].join(
          '\n',
        ),
      ),
      T.flatMap((data) => sign(key)(data)),
    )

const toHeaders = (now: Date, digest: string, signature: string, inbox: URL): T.Task<HeadersInit> =>
  T.of({
    Host: inbox.hostname,
    Date: now.toUTCString(),
    Digest: digest,
    Signature: [
      'keyId="https://pub.kosui.me/kosui"',
      'algorithm="rsa-sha256"',
      'headers="(request-target) host date digest"',
      `signature="${signature}"`,
    ].join(),
    Accept: 'application/json',
    'Accept-Encoding': 'gzip',
    'Cache-Control': 'max-age=0',
    'Content-Type': 'application/activity+json',
  } as const)

export const ActivityStoreFactory = {
  new: (): ActivityStore => ({
    store: (inbox: string, activity: Activity, key: CryptoKey, now: Date) =>
      pipe(
        T.of({
          signer: signActivity(key),
          body: JSON.stringify(activity),
          inboxAsUrl: new URL(inbox),
        } as const),
        T.bind('digest', ({ body }) => toDigest(body)),
        T.bind('signature', ({ digest, signer, inboxAsUrl }) => signer(digest, inboxAsUrl, now)),
        T.bind('headers', ({ digest, signature, inboxAsUrl }) => toHeaders(now, digest, signature, inboxAsUrl)),
        T.flatMap(({ headers, body, inboxAsUrl }) => fetchAsTask(inboxAsUrl, { method: 'POST', body, headers })),
      ),
  }),
}
