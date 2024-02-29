import { webcrypto as crypto } from 'node:crypto'
import { z } from 'zod'
import { WellKnown } from '@pub.kosui.me/worker/src/wellknown'
import { createNote, Note } from '@pub.kosui.me/worker/src/domain'
import { SignKeyResolverFactory } from '@pub.kosui.me/worker/src/adaptor/secondary/privatekey/resolver'
import { ActivityStoreFactory } from '@pub.kosui.me/worker/src/adaptor/secondary/activitypub/activityStore'

const env = z
  .object({
    PEM: z.string(),
  })
  .parse(process.env)

export const main = async () => {
  const key = await SignKeyResolverFactory.new(env.PEM, crypto.subtle).resolve()()
  const now = new Date()
  const note = Note.from({
    attributedTo: WellKnown.actor,
    content: 'This is a note',
    published: now.toISOString(),
  })
  const created = createNote(note)

  ActivityStoreFactory.new().store('https://pub.kosui.me/outbox', created, key, now)
}

main()
