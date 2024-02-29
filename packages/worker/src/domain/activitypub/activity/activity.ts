import { z } from 'zod'
import { Context } from '../helper/context'
import { newOrZodError } from '../helper/newOrZodError'
import { ulidFactory } from 'ulid-workers'
import { WellKnown } from '../../../wellknown'
import { Note } from '../note'

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

export const zodCreateActivity = z.object({
  '@context': Context,
  id: z.string(),
  type: z.literal('Create'),
  actor: zodActivityActor,
  object: Note.zod,
  published: z.string(),
  to: z.array(z.string()).optional(),
  cc: z.array(z.string()).optional(),
})
export type CreateActivity = z.infer<typeof zodCreateActivity>
export const CreateActivity = {
  new: newOrZodError(zodCreateActivity),
  from: (params: Omit<CreateActivity, '@context' | 'type'>): CreateActivity => ({
    '@context': WellKnown.context,
    type: 'Create',
    ...params,
  }),
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
  from: (params: Omit<AcceptActivity, '@context' | 'type'>): AcceptActivity => ({
    '@context': WellKnown.context,
    type: 'Accept',
    ...params,
  }),
}

const zodActivity = z.discriminatedUnion('type', [zodUndoActivity, zodFollowActivity, zodCreateActivity, zodAcceptActivity])
export type Activity = z.infer<typeof zodActivity>

export const Activity = {
  new: newOrZodError(zodActivity),
  extractActorId: (activity: Activity): string => {
    if (typeof activity.actor === 'string') {
      return activity.actor
    }
    return activity.actor.id
  },
} as const
