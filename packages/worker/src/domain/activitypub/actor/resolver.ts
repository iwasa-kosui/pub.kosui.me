import type { ZodError } from 'zod'
import type { Actor } from './actor'
import type * as TE from 'fp-ts/TaskEither'

export type ActorResolverError =
  | {
      type: 'ClientError' | 'ServerError'
      cause: Error
    }
  | {
      type: 'ParseError'
      cause: ZodError<Actor>
    }

export interface ActorResolver {
  resolve(id: string): TE.TaskEither<ActorResolverError, Actor>
}
