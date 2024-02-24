import * as TE from 'fp-ts/TaskEither'
import * as T from 'fp-ts/Task'
import * as E from 'fp-ts/Either'
import { pipe } from 'fp-ts/function'

type Options = {
  method?: string
  body?: BodyInit
  headers?: HeadersInit
}

export const fetchAsTask = (
  input: URL,
  { method, body, headers }: Options,
): TE.TaskEither<{ type: 'ServerError' | 'ClientError'; cause: Error }, Response> =>
  pipe(
    () =>
      fetch(input, {
        method,
        headers,
        body,
      }),
    T.flatMap(
      TE.fromPredicate(
        (resp) => resp.ok,
        (errResp) => errResp,
      ),
    ),
    TE.swap,
    TE.flatMap((errResp) => () => errResp.text().then((body) => E.right({ body, status: errResp.status }))),
    TE.swap,
    TE.mapLeft(({ body, status }) => {
      console.error({ body, status })
      const cause = new Error(`${status} ${body}`)
      return {
        type: status >= 500 ? 'ServerError' : 'ClientError',
        cause,
      }
    }),
  )
