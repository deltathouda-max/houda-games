// カイジの「17歩」を簡略実装したもの。
// 本来は「満貫縛りのテンパイ」だが、役の判定エンジンまでは実装せず、
// 4面子1雀頭が揃う標準形の完成判定のみを「あがり」の条件として扱う簡易版。
const SUITS = ['m', 'p', 's']
export const ALL_TILES = [
  ...SUITS.flatMap((s) => Array.from({ length: 9 }, (_, i) => `${i + 1}${s}`)),
  ...Array.from({ length: 7 }, (_, i) => `${i + 1}z`),
]

const HONOR_LABEL = { 1: '東', 2: '南', 3: '西', 4: '北', 5: '白', 6: '發', 7: '中' }

export function tileLabel(code) {
  const suit = code.slice(-1)
  const num = parseInt(code, 10)
  return suit === 'z' ? HONOR_LABEL[num] : String(num)
}

export function tileSuitClass(code) {
  const suit = code.slice(-1)
  if (suit === 'm') return 'suit-man'
  if (suit === 'p') return 'suit-pin'
  if (suit === 's') return 'suit-sou'
  return 'suit-honor'
}

function compareTileCodes(a, b) {
  const order = { m: 0, p: 1, s: 2, z: 3 }
  const sa = a.slice(-1), sb = b.slice(-1)
  if (order[sa] !== order[sb]) return order[sa] - order[sb]
  return parseInt(a, 10) - parseInt(b, 10)
}

export function sortTiles(tiles) {
  return [...tiles].sort(compareTileCodes)
}

function buildCounts(tiles) {
  const counts = {}
  tiles.forEach((t) => { counts[t] = (counts[t] || 0) + 1 })
  return counts
}

// countsに残った牌が全て面子(刻子/順子)に分解できるか(バックトラック)
function canFormMelds(counts) {
  const keys = Object.keys(counts).filter((k) => counts[k] > 0).sort(compareTileCodes)
  if (keys.length === 0) return true
  const t = keys[0]

  if (counts[t] >= 3) {
    counts[t] -= 3
    if (canFormMelds(counts)) { counts[t] += 3; return true }
    counts[t] += 3
  }

  const suit = t.slice(-1)
  const num = parseInt(t, 10)
  if (suit !== 'z' && num <= 7) {
    const t2 = `${num + 1}${suit}`
    const t3 = `${num + 2}${suit}`
    if ((counts[t2] || 0) > 0 && (counts[t3] || 0) > 0) {
      counts[t]--; counts[t2]--; counts[t3]--
      if (canFormMelds(counts)) { counts[t]++; counts[t2]++; counts[t3]++; return true }
      counts[t]++; counts[t2]++; counts[t3]++
    }
  }
  return false
}

// 14枚が4面子1雀頭の完成形かどうか(役の縛りなし)
export function isComplete14(tiles) {
  if (tiles.length !== 14) return false
  const counts = buildCounts(tiles)
  const pairCandidates = Object.keys(counts).filter((k) => counts[k] >= 2)
  for (const t of pairCandidates) {
    counts[t] -= 2
    if (canFormMelds(counts)) { counts[t] += 2; return true }
    counts[t] += 2
  }
  return false
}

// 13枚がテンパイかどうか。待ち牌の一覧も返す
export function isTenpai(tiles13) {
  if (tiles13.length !== 13) return { tenpai: false, waits: [] }
  const waits = ALL_TILES.filter((t) => isComplete14([...tiles13, t]))
  return { tenpai: waits.length > 0, waits }
}

export const ANTE_17HO = 30
export const MAX_TURNS = 34 // 17巡 x 2人
