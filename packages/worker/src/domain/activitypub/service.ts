import { ulidFactory } from 'ulid-workers'
import { WellKnown } from '../../wellknown'
import { AcceptActivity, CreateActivity, FollowActivity } from './activity/activity'
import { Note } from './note'

const ulid = ulidFactory()

export const createNote = (note: Note): CreateActivity =>
  CreateActivity.from({
    object: { ...note, id: note.id ?? `${WellKnown.host}/note/${ulid()}` },
    id: `${WellKnown.host}/create/${ulid()}`,
    actor: note.attributedTo,
    published: note.published,
    to: note.to,
    cc: note.cc,
  })

export const acceptFollow = (activity: FollowActivity, now: Date): AcceptActivity =>
  AcceptActivity.from({
    id: `${WellKnown.host}/accept/${ulid(now.getTime())}`,
    actor: WellKnown.actor,
    object: activity,
  })
