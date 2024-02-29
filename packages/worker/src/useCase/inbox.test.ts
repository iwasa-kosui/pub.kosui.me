import * as E from 'fp-ts/Either'
import * as TE from 'fp-ts/TaskEither'
import { ActivityStore, Actor, ActorResolver, FollowActivity } from '../domain'
import { WellKnown } from '../wellknown'
import { InboxUseCase } from './inbox'

const genKey = (): Promise<CryptoKey> =>
  crypto.subtle.generateKey(
    {
      name: 'RSASSA-PKCS1-v1_5',
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: 'SHA-256',
    },
    true,
    ['sign'],
  ) as Promise<CryptoKey>

const actorOf = (id: string, inbox: string): Actor =>
  Actor.zod.parse({
    '@context': WellKnown.context,
    id,
    inbox,
  })

describe('InboxUseCase', () => {
  const followActivity = FollowActivity.zod.parse({
    '@context': WellKnown.context,
    id: 'http://www.test.example/activity/1',
    type: 'Follow',
    actor: 'http://example.org/profiles/joe',
    object: WellKnown.actor,
  })
  const actor = actorOf('http://example.org/profiles/joe', 'http://example.org/profiles/joe/inbox')

  describe('when valid follow activity received', () => {
    const mockResolve: jest.Mocked<ActorResolver['resolve']> = jest.fn(() => TE.right(actor))
    const mockStore: jest.Mocked<ActivityStore['store']> = jest.fn(() => TE.right({}))
    const now = new Date()
    const useCase = InboxUseCase.new({
      now,
      signKeyResolver: {
        resolve: () => () => genKey(),
      },
      actorResolver: {
        resolve: mockResolve,
      },
      activityStore: {
        store: mockStore,
      },
    })

    const res = useCase.run(followActivity)()
    it('returns right', async () => {
      const actual = await res
      expect(actual).toHaveProperty('right')
    })

    it('stores accept activity', async () => {
      await res
      expect(mockStore).toHaveBeenCalledWith(
        actor.inbox,
        expect.objectContaining({
          object: expect.objectContaining(followActivity),
        }),
        expect.anything(),
        now,
      )
    })
    it('resolves actor', async () => {
      await res
      expect(mockResolve).toHaveBeenCalledWith(actor.id)
    })
  })

  describe('when actor not found', () => {
    const useCase = InboxUseCase.new({
      now: new Date(),
      signKeyResolver: {
        resolve: () => () => genKey(),
      },
      actorResolver: {
        resolve: (id: string) =>
          TE.left({
            type: 'ServerError',
            cause: new Error(`${id} not found`),
          }),
      },
      activityStore: {
        store: () => TE.right({}),
      },
    })

    const res = useCase.run(followActivity)()
    it('returns left', async () => {
      const actual = await res
      expect(actual).toEqual(
        E.left({
          type: 'ActorNotAcceptable',
          actorId: 'http://example.org/profiles/joe',
        }),
      )
    })
  })

  describe('when failed to store activity', () => {
    const useCase = InboxUseCase.new({
      now: new Date(),
      signKeyResolver: {
        resolve: () => () => genKey(),
      },
      actorResolver: {
        resolve: (id: string) => TE.of(actorOf(id, `${id}/inbox`)),
      },
      activityStore: {
        store: () => TE.left({ type: 'ServerError', cause: new Error() }),
      },
    })

    const res = useCase.run(followActivity)()
    it('returns left', async () => {
      const actual = await res
      expect(actual).toEqual(
        E.left({
          type: 'UnacceptableFollowError',
          activity: followActivity,
        }),
      )
    })
  })
})
