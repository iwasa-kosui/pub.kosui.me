import { z } from 'zod'
import { Context } from '../helper/context'
import { newOrZodError } from '../helper/newOrZodError'

const zodActor = z.object({
  '@context': Context,
  id: z.string().url(),
  inbox: z.string().url(),
})
export type Actor = z.infer<typeof zodActor>

export const Actor = {
  zod: zodActor,
  new: newOrZodError(zodActor),
} as const
