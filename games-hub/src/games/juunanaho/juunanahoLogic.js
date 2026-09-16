// カイジの「17歩」を簡略実装したもの。
// 通常の麻雀と同じく、各牌種は4枚ずつ存在する(136枚)。対局開始時にシャッフルした
// 山から両者にそれぞれ34枚を配り、自分の34枚の中から13枚を選んでテンパイ(あと1枚で
// 満貫以上になる形)を作る。残り21枚が自分の捨て牌候補になる。
const SUITS = ['m', 'p', 's']
export const ALL_TILES = [
  ...SUITS.flatMap((s) => Array.from({ length: 9 }, (_, i) => `${i + 1}${s}`)),
  ...Array.from({ length: 7 }, (_, i) => `${i + 1}z`),
]

// 各牌種4枚ずつの136枚デッキ
export function standardDeck() {
  return ALL_TILES.flatMap((t) => [t, t, t, t])
}

export function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

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
