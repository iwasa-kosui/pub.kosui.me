import { z } from 'zod'
import { Context } from '../helper/context'
import { newOrZodError } from '../helper/newOrZodError'
import { WellKnown } from '../../../wellknown'

const zodNote = z.object({
  '@context': Context,
  type: z.literal('Note'),
  id: z.string().url().optional(),
  attributedTo: z.string(),
  content: z.string(),
  published: z.string(),
  to: z.array(z.string()).optional(),
  cc: z.array(z.string()).optional(),
})

export const Note = {
  zod: zodNote,
  new: newOrZodError(zodNote),
  from: ({ id, attributedTo, content, published, to, cc }: Omit<Note, '@context' | 'type'>): Note => ({
    '@context': WellKnown.context,
    type: 'Note',
    id,
    attributedTo,
    content,
    published,
    to,
    cc,
  }),
} as const
export type Note = z.infer<typeof zodNote>
