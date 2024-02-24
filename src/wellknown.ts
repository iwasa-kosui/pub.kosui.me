const host = 'https://pub.kosui.me' as const
export const WellKnown = {
  host,
  context: 'https://www.w3.org/ns/activitystreams',
  actor: `${host}/kosui`,
  contentTypeActivityJson: 'application/activity+json',
} as const
