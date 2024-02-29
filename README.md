# pub.kosui.me - ActivityPub on Cloudflare Workers

> [!WARNING]
> It's in the experimental stage.

## Features

### Basic

- [x] `/.well-known/webfinger`
- [x] `/.well-known/nodeinfo`
- [x] `/.well-known/host-meta`
- [x] `/nodeinfo/2.1`

### Actor objects

- [ ] inbox
  - [ ] GET
  - [x] POST  
    Only allows following.
- [ ] outbox
- [ ] following
- [ ] followers
- [ ] liked
