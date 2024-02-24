import { flow, pipe } from 'fp-ts/function'
import { Activity, FollowActivity, ActorResolver, ActivityStore, SignKeyResolver } from '../domain'
import * as TE from 'fp-ts/TaskEither'

type Props = Readonly<{
  now: Date
  signKeyResolver: SignKeyResolver
  actorResolver: ActorResolver
  activityStore: ActivityStore
}>

type UnprocessableActivityError = Readonly<{ type: 'UnprocessableActivity'; activity: Activity }>
const UnprocessableActivityError = {
  new: (activity: Activity): UnprocessableActivityError => ({ type: 'UnprocessableActivity', activity }),
} as const

type ActorNotAcceptableError = Readonly<{ type: 'ActorNotAcceptable'; actorId: string }>
const ActorNotAcceptableError = {
  new: (actorId: string): ActorNotAcceptableError => ({ type: 'ActorNotAcceptable', actorId }),
} as const

type UnacceptableFollowError = Readonly<{ type: 'UnacceptableFollowError'; activity: Activity }>
const UnacceptableFollowError = {
  new: (activity: Activity): UnacceptableFollowError => ({ type: 'UnacceptableFollowError', activity }),
} as const

export type InboxUseCase = Readonly<{
  run(activity: Activity): TE.TaskEither<UnprocessableActivityError | ActorNotAcceptableError | UnacceptableFollowError, unknown>
}>

export const InboxUseCase = {
  new: ({ now, signKeyResolver, actorResolver, activityStore }: Props): InboxUseCase => ({
    run: flow(
      TE.fromPredicate(
        (activity): activity is FollowActivity => activity.type === 'Follow',
        (activity) => UnprocessableActivityError.new(activity),
      ),
      TE.bindTo('activity'),
      TE.bindW(
        'actorId',
        flow(({ activity }) => activity, Activity.extractActorId, TE.of),
      ),
      TE.flatMap(({ activity, actorId }) =>
        pipe(
          actorId,
          actorResolver.resolve,
          TE.map((actor) => ({ activity, actor })),
          TE.mapLeft(() => ActorNotAcceptableError.new(actorId)),
        ),
      ),
      TE.bindW('cryptoKey', () => pipe(signKeyResolver.resolve(), TE.fromTask)),
      TE.flatMap(({ activity, actor, cryptoKey }) =>
        pipe(
          activityStore.store(actor.inbox, Activity.acceptFollow(activity, now), cryptoKey, now),
          TE.mapLeft(() => UnacceptableFollowError.new(activity)),
        ),
      ),
    ),
  }),
} as const
