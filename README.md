# pub.kosui.me - ActivityPub on Cloudflare Workers

> [!WARNING]
> It's in the experimental stage.

## Dependencies

- Cloudflare Workers
- TypeScript
- hono
- zod
- fp-ts

## Features

### Basic

- [x] [/.well-known/webfinger](https://pub.kosui.me/.well-known/webfinger?resource=acct:kosui@pub.kosui.me)
- [x] [/.well-known/nodeinfo](https://pub.kosui.me/.well-known/nodeinfo)
- [x] [/.well-known/host-meta](https://pub.kosui.me/.well-known/host-meta)
- [x] [/nodeinfo/2.1](https://pub.kosui.me/nodeinfo/2.1)

### Actor objects

- [ ] inbox
  - [ ] GET
  - [x] POST  
    Only allows following.
- [ ] outbox
- [ ] following
- [ ] followers
- [ ] liked
