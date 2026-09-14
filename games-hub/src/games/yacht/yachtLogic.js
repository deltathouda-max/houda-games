export const CATEGORIES = [
  { id: 'ones', label: '1の目' },
  { id: 'twos', label: '2の目' },
  { id: 'threes', label: '3の目' },
  { id: 'fours', label: '4の目' },
  { id: 'fives', label: '5の目' },
  { id: 'sixes', label: '6の目' },
  { id: 'choice', label: 'チョイス(合計)' },
  { id: 'fourKind', label: 'フォーカード' },
  { id: 'fullHouse', label: 'フルハウス' },
  { id: 'sStraight', label: 'S.ストレート' },
  { id: 'lStraight', label: 'L.ストレート' },
  { id: 'yacht', label: 'ヨット' },
]

const NUMBER_KIND = { ones: 1, twos: 2, threes: 3, fours: 4, fives: 5, sixes: 6 }

function counts(dice) {
  const c = [0, 0, 0, 0, 0, 0, 0]
  dice.forEach((d) => { c[d]++ })
  return c
}

export function computeScore(category, dice) {
  const sum = dice.reduce((a, b) => a + b, 0)
  const c = counts(dice)
  if (NUMBER_KIND[category]) return c[NUMBER_KIND[category]] * NUMBER_KIND[category]
  if (category === 'choice') return sum
  if (category === 'fourKind') return c.some((n) => n >= 4) ? sum : 0
  if (category === 'fullHouse') return c.some((n) => n === 3) && c.some((n) => n === 2) ? 25 : 0
  if (category === 'sStraight') {
    const has = (vals) => vals.every((v) => c[v] > 0)
    return has([1, 2, 3, 4]) || has([2, 3, 4, 5]) || has([3, 4, 5, 6]) ? 15 : 0
  }
  if (category === 'lStraight') {
    const has = (vals) => vals.every((v) => c[v] > 0) && dice.length === 5 && new Set(dice).size === 5
    return has([1, 2, 3, 4, 5]) || has([2, 3, 4, 5, 6]) ? 30 : 0
  }
  if (category === 'yacht') return c.some((n) => n === 5) ? 50 : 0
  return 0
}

export function rollDice(count) {
  return Array.from({ length: count }, () => 1 + Math.floor(Math.random() * 6))
}

export function totalScore(scorecard) {
  return CATEGORIES.reduce((sum, cat) => sum + (scorecard?.[cat.id] ?? 0), 0)
}

export function emptyScorecard() {
  const sc = {}
  CATEGORIES.forEach((c) => { sc[c.id] = null })
  return sc
}

export function isScorecardFull(scorecard) {
  return CATEGORIES.every((c) => scorecard?.[c.id] !== null && scorecard?.[c.id] !== undefined)
}
