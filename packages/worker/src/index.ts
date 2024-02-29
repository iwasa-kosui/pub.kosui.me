import { Context, Hono } from 'hono'
import { InboxUseCase } from './useCase/inbox'
import * as E from 'fp-ts/Either'
import { WellKnown } from './wellknown'
import { ActorResolverFactory } from './adaptor/secondary/activitypub/actorResolver'
import { ActivityStoreFactory } from './adaptor/secondary/activitypub/activityStore'
import { SignKeyResolverFactory } from './adaptor/secondary/privatekey/resolver'
import { Activity } from './domain'
import { type StatusCode } from 'hono/utils/http-status'

const app = new Hono<{ Bindings: { PEM: string } }>()

app.get('/.well-known/host-meta', (c) => {
  c.header('Content-Type', 'application/jrd+xml')
  return c.text(`<XRD>
  <Link rel="lrdd" type="application/xrd+xml"
    template="${WellKnown.host}/.well-known/webfinger
  ?resource={uri}"/>
</XRD>`)
})

const asJrdJson = (obj: unknown) => (c: Context) => {
  c.status(200)
  c.header('Content-Type', 'application/jrd+json')
  return c.body(JSON.stringify(obj))
}

const asActivityJson =
  (obj: unknown, status: StatusCode = 200) =>
  (c: Context) => {
    c.status(status)
    c.header('Content-Type', WellKnown.contentTypeActivityJson)
    return c.body(JSON.stringify(obj))
  }

app.get(
  '/.well-known/nodeinfo',
  asJrdJson({
    links: [
      {
        rel: 'http://nodeinfo.diaspora.software/ns/schema/2.1',
        href: `${WellKnown.host}/nodeinfo/2.1`,
      },
    ],
  }),
)

app.get(
  '/nodeinfo/2.1',
  asJrdJson({
    openRegistrations: false,
    protocols: ['activitypub'],
    software: {
      name: 'kosui',
      version: '2024.02.23.01',
    },
    usage: {
      users: {
        total: 1,
      },
    },
    version: '2.1',
  }),
)

app.get(
  '/.well-known/webfinger',
  asJrdJson({
    subject: 'acct:kosui@pub.kosui.me',
    aliases: [WellKnown.actor],
    links: [
      {
        rel: 'http://webfinger.net/rel/profile-page',
        type: 'text/html',
        href: WellKnown.actor,
      },
      {
        rel: 'self',
        type: WellKnown.contentTypeActivityJson,
        href: WellKnown.actor,
      },
    ],
  }),
)

app.get(
  '/kosui',
  asActivityJson({
    '@context': [WellKnown.context, 'https://w3id.org/security/v1'],
    id: WellKnown.actor,
    type: 'Person',
    url: WellKnown.actor,
    inbox: `${WellKnown.host}/inbox`,
    outbox: `${WellKnown.host}/outbox`,
    followers: `${WellKnown.host}/followers`,
    following: `${WellKnown.host}/following`,
    preferredUsername: 'kosui',
    publicKey: {
      publicKeyPem:
        '-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAzr+u+T5NN8k1Wt27+DM7\nOrAyl4o2AC1UTqvTXEmNuin24r/kE9bvLmu/8AjoYq9dRRhh28oVxaelQD/fFQ0D\nwYVtqy86KJpGiughRum83XkSzGZyLAyzhx0reIil1TkNFtLpGahu8Q/D/c4OPpZf\n/GiArPixU4UCEI4RRfERPXGOtZdvrADCPsB9Fy085qrGlDvo/FmZXM/n1rCcu56v\nHeGBqivS3F/TOYZksrewnM7TsH6OmuDhFsSf76VpCbEjnRqTXNdt6/rYlZ0d7YE+\nOFrY4nZR8L31hg9Y8WhG/Q06IbvzW2Z7wsIMXleHGTQ3Om8As8xO6JcfAcRCpBjw\nvQIDAQAB\n-----END PUBLIC KEY-----\n',
      id: WellKnown.actor,
      owner: WellKnown.actor,
    },
    icon: {
      mediaType: 'image/png',
      type: 'Image',
      url: 'https://kosui.me/icon/link',
    },
  }),
)

app.post('/inbox', async (c) => {
  const maybeActivity = Activity.new(await c.req.json())
  if (E.isLeft(maybeActivity)) {
    return asActivityJson({ message: maybeActivity.left.message }, 400)(c)
  }

  const activity = maybeActivity.right
  const inboxUseCase = InboxUseCase.new({
    now: new Date(),
    actorResolver: ActorResolverFactory.new(),
    activityStore: ActivityStoreFactory.new(),
    signKeyResolver: SignKeyResolverFactory.new(c.env.PEM),
  })

  const res = await inboxUseCase.run(activity)()

  if (E.isRight(res)) {
    return asActivityJson({})(c)
  }
  return asActivityJson({}, 405)(c)
})

app.get(
  '/outbox',
  asActivityJson({
    '@context': WellKnown.context,
    id: `${WellKnown.host}/outbox`,
    type: 'OrderedCollection',
    totalItems: 0,
    first: `${WellKnown.host}/outbox?page=true`,
    last: `${WellKnown.host}/outbox?min_id=0&page=true`,
  }),
)

app.use('/*', async (c, next) => {
  await next()
  console.log(c.req)
})

export default app
