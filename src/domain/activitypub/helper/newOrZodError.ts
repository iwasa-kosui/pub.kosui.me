import { type ZodError, type ZodType } from 'zod'
import * as E from 'fp-ts/Either'
import { pipe } from 'fp-ts/function'

export type OrZodError<O> = E.Either<ZodError<O>, O>

export const newOrZodError =
  <O>(zodType: ZodType<O>) =>
  (v: unknown): OrZodError<O> => {
    return pipe(v, zodType.safeParse, (x) => (x.success ? E.right(x.data) : E.left(x.error)))
  }
