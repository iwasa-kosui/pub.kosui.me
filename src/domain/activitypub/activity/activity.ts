import { z } from 'zod'
import { Context } from '../helper/context'
import { newOrZodError } from '../helper/newOrZodError'
import { ulidFactory } from 'ulid-workers'
import { WellKnown } from '../../../wellknown'

const ulid = ulidFactory()

const LinkActor = z.string().url()
const ObjectActor = z.object({ id: z.string().url() })
const zodActivityActor = z.union([LinkActor, ObjectActor])
type ActivityActor = z.infer<typeof zodActivityActor>

const zodFollowActivity = z.object({
  '@context': Context,
  id: z.string().optional(),
  type: z.literal('Follow'),
  actor: zodActivityActor,
  object: z.string().url(),
})
export type FollowActivity = z.infer<typeof zodFollowActivity>
export const FollowActivity = {
  zod: zodFollowActivity,
  new: newOrZodError(zodFollowActivity),
}

export const zodUndoActivity = z.object({
  '@context': Context,
  id: z.string(),
  type: z.literal('Undo'),
  actor: zodActivityActor,
  object: zodFollowActivity,
})
export type UndoActivity = z.infer<typeof zodUndoActivity>
export const UndoActivity = {
  new: newOrZodError(zodUndoActivity),
}

const zodAcceptActivity = z.object({
  '@context': Context,
  id: z.string(),
  type: z.literal('Accept'),
  actor: zodActivityActor,
  object: zodFollowActivity,
})
export type AcceptActivity = z.infer<typeof zodAcceptActivity>
export const AcceptActivity = {
  new: newOrZodError(zodAcceptActivity),
}

const zodActivity = z.discriminatedUnion('type', [zodUndoActivity, zodFollowActivity, zodAcceptActivity])
export type Activity = z.infer<typeof zodActivity>

const createAcceptActivity = (id: string, actor: ActivityActor, object: FollowActivity): AcceptActivity =>
  zodAcceptActivity.parse({
    '@context': WellKnown.context,
    id,
    type: 'Accept',
    actor,
    object,
  })

export const Activity = {
  new: newOrZodError(zodActivity),
  extractActorId: (activity: Activity): string => {
    if (typeof activity.actor === 'string') {
      return activity.actor
    }
    return activity.actor.id
  },
  acceptFollow: (activity: FollowActivity, now: Date): AcceptActivity =>
    createAcceptActivity(`${WellKnown.host}/accept/${ulid(now.getTime())}`, WellKnown.actor, activity),
} as const
