import { Activity } from './'
import * as E from 'fp-ts/Either'

const followByLinkActor = {
  '@context': 'https://www.w3.org/ns/activitystreams',
  id: 'https://example.com/users/foobar#follow/1',
  type: 'Follow',
  actor: 'https://example.com/users/foobar',
  object: 'https://example.org/yo',
}

const followByObjectActor = {
  '@context': 'https://www.w3.org/ns/activitystreams',
  actor: { id: 'https://example.com/users/foobar' },
  object: 'https://example.org/yo',
  type: 'Follow',
}

describe('Activity', () => {
  it.each([
    { input: followByLinkActor, title: 'link-based actor' },
    { input: followByObjectActor, title: 'object-based actor' },
  ])('can parse Follow activity ($title)', ({ input }) => {
    const actual = Activity.new(input)
    expect(actual).toEqual(E.right(input))
  })
})
