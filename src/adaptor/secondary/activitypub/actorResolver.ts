import * as TE from 'fp-ts/TaskEither'
import { Actor, type ActorResolverError, type ActorResolver } from '../../../domain'
import { pipe } from 'fp-ts/function'
import { fetchAsTask } from '../helper/fetchAsTask'
import { AcceptActivityHeaders } from '../helper/headers'

export const ActorResolverFactory = {
  new: (): ActorResolver => ({
    resolve: (id: string): TE.TaskEither<ActorResolverError, Actor> =>
      pipe(
        fetchAsTask(new URL(id), { headers: AcceptActivityHeaders }),
        TE.flatMap((resp) =>
          pipe(
            () => resp.json().then(Actor.new),
            TE.mapLeft(
              (cause) =>
                ({
                  type: 'ParseError',
                  cause,
                }) as const,
            ),
          ),
        ),
      ),
  }),
}
