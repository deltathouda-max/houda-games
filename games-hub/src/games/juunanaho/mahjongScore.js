// 17歩の「満貫以上縛り」判定エンジン。
//
// このゲームは34種の牌から重複なく13枚を選ぶため、自分の手牌は必ず全て異なる牌種になる。
// あがり牌(相手の捨て牌)と手牌の中の同じ牌種だけが対子(2枚)になり、それ以外は1枚ずつ。
// そのため刻子(同じ牌3枚)は構造上作れず、面子は必ず4つとも順子、雀頭は必ず単騎待ちになる。
// この形は符が常に20(基本)+10(面前ロン)+2(単騎)+雀頭が字牌なら+2 = 32か34符で、
// 切り上げると必ず40符になる。符が固定されるため「満貫以上」の判定は
// 「4翻以上かどうか」に単純化できる(4翻40符は満貫、3翻では40符では届かない)。
import { ALL_TILES, isTenpai } from './juunanahoLogic.js'

function buildCounts(tiles) {
  const counts = {}
  tiles.forEach((t) => { counts[t] = (counts[t] || 0) + 1 })
  return counts
}

function compareTileCodes(a, b) {
  const order = { m: 0, p: 1, s: 2, z: 3 }
  const sa = a.slice(-1), sb = b.slice(-1)
  if (order[sa] !== order[sb]) return order[sa] - order[sb]
  return parseInt(a, 10) - parseInt(b, 10)
}

// 12枚(対子を除いた残り)を4つの面子に分解する。このゲームでは刻子が作れないため
// 常に一意に分解できる(分解できない場合はnull)
function decomposeMelds(counts, acc) {
  const keys = Object.keys(counts).filter((k) => counts[k] > 0).sort(compareTileCodes)
  if (keys.length === 0) return [...acc]
  const t = keys[0]

  if (counts[t] >= 3) {
    counts[t] -= 3
    acc.push({ type: 'triplet', tiles: [t, t, t] })
    const result = decomposeMelds(counts, acc)
    if (result) return result
    acc.pop()
    counts[t] += 3
  }

  const suit = t.slice(-1)
  const num = parseInt(t, 10)
  if (suit !== 'z' && num <= 7) {
    const t2 = `${num + 1}${suit}`
    const t3 = `${num + 2}${suit}`
    if ((counts[t2] || 0) > 0 && (counts[t3] || 0) > 0) {
      counts[t]--; counts[t2]--; counts[t3]--
      acc.push({ type: 'run', tiles: [t, t2, t3] })
      const result = decomposeMelds(counts, acc)
      if (result) return result
      acc.pop()
      counts[t]++; counts[t2]++; counts[t3]++
    }
  }
  return null
}

const DRAGONS = new Set(['5z', '6z', '7z'])
const TERMINALS = new Set(['1m', '9m', '1p', '9p', '1s', '9s'])
const HONORS = new Set(['1z', '2z', '3z', '4z', '5z', '6z', '7z'])

function isTerminalOrHonor(t) {
  return TERMINALS.has(t) || HONORS.has(t)
}

export function nextDoraTile(indicator) {
  const suit = indicator.slice(-1)
  const num = parseInt(indicator, 10)
  if (suit === 'z') {
    if (num <= 4) return `${(num % 4) + 1}z` // 東南西北の巡回
    return `${((num - 5 + 1) % 3) + 5}z` // 白發中の巡回
  }
  return `${(num % 9) + 1}${suit}`
}

export function randomDoraIndicator() {
  return ALL_TILES[Math.floor(Math.random() * ALL_TILES.length)]
}

// hand13(手牌13枚、重複なし)がwinTileであがれるかを判定し、役・翻数・満貫可否を返す
export function evaluateWin(hand13, winTile, doraTile) {
  if (!hand13.includes(winTile)) return { valid: false }
  const rest = hand13.filter((t) => t !== winTile)
  const melds = decomposeMelds(buildCounts(rest), [])
  if (!melds || melds.length !== 4) return { valid: false }

  const pairTile = winTile
  const allTiles = [pairTile, pairTile, ...melds.flatMap((m) => m.tiles)]
  const yaku = []

  if (allTiles.every((t) => !isTerminalOrHonor(t))) {
    yaku.push({ name: 'タンヤオ', han: 1 })
  }

  for (const suit of ['m', 'p', 's']) {
    const need = [1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => `${n}${suit}`)
    if (need.every((t) => allTiles.includes(t))) {
      yaku.push({ name: '一気通貫', han: 2 })
      break
    }
  }

  const runStarts = melds.filter((m) => m.type === 'run').map((m) => ({ suit: m.tiles[0].slice(-1), num: parseInt(m.tiles[0], 10) }))
  for (let num = 1; num <= 7; num++) {
    if (['m', 'p', 's'].every((suit) => runStarts.some((r) => r.suit === suit && r.num === num))) {
      yaku.push({ name: '三色同順', han: 2 })
      break
    }
  }

  const groups = [[pairTile, pairTile], ...melds.map((m) => m.tiles)]
  if (groups.every((g) => g.some((t) => isTerminalOrHonor(t)))) {
    const anyHonor = allTiles.some((t) => t.endsWith('z'))
    yaku.push(anyHonor ? { name: '混全帯幺九', han: 2 } : { name: '純全帯幺九', han: 3 })
  }

  const han = yaku.reduce((s, y) => s + y.han, 0)
  const dora = doraTile ? allTiles.filter((t) => t === doraTile).length : 0
  const totalHan = han + dora
  const fu = 40 // このゲームの構造上、面前ロン・単騎待ちの4順子手は常に切り上げ40符になる

  return {
    valid: true,
    yaku,
    han,
    dora,
    totalHan,
    fu,
    manganOrAbove: han > 0 && totalHan >= 4, // 役なし(ドラのみ)ではあがれない
  }
}

// hand13が「あと1枚で満貫以上になる」待ちを少なくとも1つ持っているか
export function tenpaiHasManganWait(hand13, doraTile) {
  const { tenpai, waits } = isTenpai(hand13)
  if (!tenpai) return { ok: false, waits: [] }
  const manganWaits = waits.filter((w) => evaluateWin(hand13, w, doraTile).manganOrAbove)
  return { ok: manganWaits.length > 0, waits, manganWaits }
}
