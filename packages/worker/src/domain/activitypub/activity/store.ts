import { Activity } from './activity'
import * as TE from 'fp-ts/TaskEither'

export interface ActivityStoreError {
  type: 'ClientError' | 'ServerError'
  cause: Error
}

export interface ActivityStore {
  store(inbox: string, activity: Activity, key: CryptoKey, now: Date): TE.TaskEither<ActivityStoreError, unknown>
}
