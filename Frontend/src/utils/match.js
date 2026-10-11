// userOne = initiator (seeker / interested), userTwo = listing owner / target.
export const otherUser = (match, me) => (match.userOne?.id === me.id ? match.userTwo : match.userOne)

export const splitList = (s) =>
  (s || '')
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean)

export const conversationKey = (a, b) => `${Math.min(a, b)}_${Math.max(a, b)}`
