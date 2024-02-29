import { z } from 'zod'
import { WellKnown } from '../../../wellknown'

export const Context = z.union([
  z.literal(WellKnown.context),
  z.array(z.any()).refine((vs) => vs.some((v) => typeof v === 'string' && v === WellKnown.context)),
])
