// 17歩の「満貫以上縛り」判定エンジン。
// 通常の麻雀と同じく各牌種4枚ずつ実在するため、刻子・対々和・役牌・七対子・国士無双なども
// 通常の麻雀と同様に成立しうる。面前ロン限定(自摸・鳴きなし)の一般的な役・符計算を実装する。
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

// 残りの牌(対子を除いた12枚)を面子(刻子/順子)に分解する全パターンを列挙する
function allMeldDecompositions(counts) {
  const keys = Object.keys(counts).filter((k) => counts[k] > 0).sort(compareTileCodes)
  if (keys.length === 0) return [[]]
  const t = keys[0]
  const results = []

  if (counts[t] >= 3) {
    counts[t] -= 3
    const subs = allMeldDecompositions(counts)
    for (const sub of subs) results.push([{ type: 'triplet', tiles: [t, t, t] }, ...sub])
    counts[t] += 3
  }

  const suit = t.slice(-1)
  const num = parseInt(t, 10)
  if (suit !== 'z' && num <= 7) {
    const t2 = `${num + 1}${suit}`
    const t3 = `${num + 2}${suit}`
    if ((counts[t2] || 0) > 0 && (counts[t3] || 0) > 0) {
      counts[t]--; counts[t2]--; counts[t3]--
      const subs = allMeldDecompositions(counts)
      for (const sub of subs) results.push([{ type: 'run', tiles: [t, t2, t3] }, ...sub])
      counts[t]++; counts[t2]++; counts[t3]++
    }
  }
  return results
}

// 14枚の完成手を「対子+4面子」に分解できる全パターンを列挙する
function allHandDecompositions(tiles14) {
  const counts = buildCounts(tiles14)
  const pairCandidates = Object.keys(counts).filter((k) => counts[k] >= 2)
  const results = []
  for (const pairTile of pairCandidates) {
    counts[pairTile] -= 2
    const meldSets = allMeldDecompositions(counts)
    counts[pairTile] += 2
    for (const melds of meldSets) {
      if (melds.length === 4) results.push({ pair: pairTile, melds })
    }
  }
  return results
}

const DRAGONS = new Set(['5z', '6z', '7z'])
const WINDS = new Set(['1z', '2z', '3z', '4z'])
const TERMINALS = new Set(['1m', '9m', '1p', '9p', '1s', '9s'])
const HONORS = new Set(['1z', '2z', '3z', '4z', '5z', '6z', '7z'])
const GREEN_TILES = new Set(['2s', '3s', '4s', '6s', '8s', '6z'])
const KOKUSHI_TILES = new Set([...TERMINALS, ...HONORS])

function isTerminalOrHonor(t) { return TERMINALS.has(t) || HONORS.has(t) }

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

function classifyWait(decomp, winTile) {
  if (decomp.pair === winTile) {
    const tripletOfWin = decomp.melds.find((m) => m.type === 'triplet' && m.tiles[0] === winTile)
    return tripletOfWin ? 'shanpon' : 'tanki'
  }
  const tripletOfWin = decomp.melds.find((m) => m.type === 'triplet' && m.tiles[0] === winTile)
  if (tripletOfWin) return 'shanpon'
  const runMeld = decomp.melds.find((m) => m.type === 'run' && m.tiles.includes(winTile))
  if (!runMeld) return 'tanki'
  const held = runMeld.tiles.filter((t) => t !== winTile)
  const heldNums = held.map((t) => parseInt(t, 10)).sort((a, b) => a - b)
  const winNum = parseInt(winTile, 10)
  if (heldNums[1] - heldNums[0] === 2) return 'kanchan'
  if ((heldNums[0] === 1 && heldNums[1] === 2 && winNum === 3) || (heldNums[0] === 8 && heldNums[1] === 9 && winNum === 7)) return 'penchan'
  return 'ryanmen'
}

function isWinningMeld(meld, winTile, waitType) {
  return waitType === 'shanpon' && meld.type === 'triplet' && meld.tiles[0] === winTile
}

function fuForTriplet(tile, concealed) {
  const bonus = isTerminalOrHonor(tile) ? 2 : 1
  return (concealed ? 4 : 2) * bonus
}

function computeFu(decomp, winTile, waitType) {
  let fu = 20 + 10 // 基本20符 + 面前ロン10符
  if (DRAGONS.has(decomp.pair)) fu += 2
  for (const meld of decomp.melds) {
    if (meld.type !== 'triplet') continue
    const concealed = !isWinningMeld(meld, winTile, waitType)
    fu += fuForTriplet(meld.tiles[0], concealed)
  }
  if (waitType === 'tanki' || waitType === 'kanchan' || waitType === 'penchan') fu += 2
  return Math.ceil(fu / 10) * 10
}

function evaluateStandardDecomposition(decomp, winTile, doraTile) {
  const waitType = classifyWait(decomp, winTile)
  const allTiles = [decomp.pair, decomp.pair, ...decomp.melds.flatMap((m) => m.tiles)]
  const yaku = []

  const allTriplets = decomp.melds.every((m) => m.type === 'triplet')
  const allRuns = decomp.melds.every((m) => m.type === 'run')

  if (allRuns && !DRAGONS.has(decomp.pair) && !WINDS.has(decomp.pair) && waitType === 'ryanmen') {
    yaku.push({ name: '平和', han: 1 })
  }
  if (allTiles.every((t) => !isTerminalOrHonor(t))) {
    yaku.push({ name: 'タンヤオ', han: 1 })
  }

  // 一盃口・二盃口(同一の順子が2組/4組)
  const runKeys = decomp.melds.filter((m) => m.type === 'run').map((m) => m.tiles[0])
  const runCounts = buildCounts(runKeys)
  const iipeikoPairs = Object.values(runCounts).filter((c) => c >= 2).length
  if (iipeikoPairs >= 2) {
    yaku.push({ name: '二盃口', han: 3 })
  } else if (iipeikoPairs === 1) {
    yaku.push({ name: '一盃口', han: 1 })
  }

  // 役牌(三元牌の刻子)
  for (const meld of decomp.melds) {
    if (meld.type === 'triplet' && DRAGONS.has(meld.tiles[0])) yaku.push({ name: '役牌', han: 1 })
  }

  for (const suit of ['m', 'p', 's']) {
    const need = [1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => `${n}${suit}`)
    if (need.every((t) => allTiles.includes(t))) { yaku.push({ name: '一気通貫', han: 2 }); break }
  }

  const runStarts = decomp.melds.filter((m) => m.type === 'run').map((m) => ({ suit: m.tiles[0].slice(-1), num: parseInt(m.tiles[0], 10) }))
  for (let num = 1; num <= 7; num++) {
    if (['m', 'p', 's'].every((suit) => runStarts.some((r) => r.suit === suit && r.num === num))) {
      yaku.push({ name: '三色同順', han: 2 }); break
    }
  }
  const tripletNums = decomp.melds.filter((m) => m.type === 'triplet' && !m.tiles[0].endsWith('z')).map((m) => ({ suit: m.tiles[0].slice(-1), num: parseInt(m.tiles[0], 10) }))
  for (let num = 1; num <= 9; num++) {
    if (['m', 'p', 's'].every((suit) => tripletNums.some((r) => r.suit === suit && r.num === num))) {
      yaku.push({ name: '三色同刻', han: 2 }); break
    }
  }

  const groups = [[decomp.pair, decomp.pair], ...decomp.melds.map((m) => m.tiles)]
  if (groups.every((g) => g.some((t) => isTerminalOrHonor(t)))) {
    const anyHonor = allTiles.some((t) => t.endsWith('z'))
    yaku.push(anyHonor ? { name: '混全帯幺九', han: 2 } : { name: '純全帯幺九', han: 3 })
  }

  if (allTriplets) yaku.push({ name: '対々和', han: 2 })

  const concealedTripletCount = decomp.melds.filter((m) => m.type === 'triplet' && !isWinningMeld(m, winTile, waitType)).length
  if (allTriplets && concealedTripletCount === 4) {
    return { valid: true, isYakuman: true, yaku: [{ name: '四暗刻', han: 13 }], han: 13, dora: 0, totalHan: 13, fu: computeFu(decomp, winTile, waitType), manganOrAbove: true }
  }
  if (concealedTripletCount >= 3) yaku.push({ name: '三暗刻', han: 2 })

  if (allTiles.every((t) => TERMINALS.has(t) || HONORS.has(t)) && allTriplets) {
    yaku.push({ name: '混老頭', han: 2 })
  }

  const suitsUsed = new Set(allTiles.filter((t) => !t.endsWith('z')).map((t) => t.slice(-1)))
  const hasHonor = allTiles.some((t) => t.endsWith('z'))
  if (suitsUsed.size === 1) {
    yaku.push(hasHonor ? { name: '混一色', han: 3 } : { name: '清一色', han: 6 })
  }

  const dragonTriplets = decomp.melds.filter((m) => m.type === 'triplet' && DRAGONS.has(m.tiles[0]))
  if (dragonTriplets.length === 3) {
    return { valid: true, isYakuman: true, yaku: [{ name: '大三元', han: 13 }], han: 13, dora: 0, totalHan: 13, fu: computeFu(decomp, winTile, waitType), manganOrAbove: true }
  }
  if (dragonTriplets.length === 2 && DRAGONS.has(decomp.pair)) {
    yaku.push({ name: '小三元', han: 2 })
  }

  if (allTiles.every((t) => t.endsWith('z'))) {
    return { valid: true, isYakuman: true, yaku: [{ name: '字一色', han: 13 }], han: 13, dora: 0, totalHan: 13, fu: computeFu(decomp, winTile, waitType), manganOrAbove: true }
  }
  if (allTiles.every((t) => TERMINALS.has(t))) {
    return { valid: true, isYakuman: true, yaku: [{ name: '清老頭', han: 13 }], han: 13, dora: 0, totalHan: 13, fu: computeFu(decomp, winTile, waitType), manganOrAbove: true }
  }
  if (allTiles.every((t) => GREEN_TILES.has(t))) {
    return { valid: true, isYakuman: true, yaku: [{ name: '緑一色', han: 13 }], han: 13, dora: 0, totalHan: 13, fu: computeFu(decomp, winTile, waitType), manganOrAbove: true }
  }

  const han = yaku.reduce((s, y) => s + y.han, 0)
  const dora = doraTile ? allTiles.filter((t) => t === doraTile).length : 0
  const totalHan = han + dora
  const fu = computeFu(decomp, winTile, waitType)
  return {
    valid: true,
    isYakuman: false,
    yaku,
    han,
    dora,
    totalHan,
    fu,
    manganOrAbove: han > 0 && (totalHan >= 5 || (totalHan === 4 && fu >= 40) || (totalHan === 3 && fu >= 70)),
  }
}

function evaluateChiitoitsu(hand13, winTile, doraTile) {
  const tiles14 = [...hand13, winTile]
  const counts = buildCounts(tiles14)
  const kinds = Object.keys(counts)
  if (kinds.length !== 7 || !kinds.every((k) => counts[k] === 2)) return null
  const yaku = [{ name: '七対子', han: 2 }]
  if (tiles14.every((t) => !isTerminalOrHonor(t))) yaku.push({ name: 'タンヤオ', han: 1 })
  const suitsUsed = new Set(tiles14.filter((t) => !t.endsWith('z')).map((t) => t.slice(-1)))
  const hasHonor = tiles14.some((t) => t.endsWith('z'))
  if (suitsUsed.size === 1) yaku.push(hasHonor ? { name: '混一色', han: 3 } : { name: '清一色', han: 6 })
  if (tiles14.every((t) => TERMINALS.has(t) || HONORS.has(t))) yaku.push({ name: '混老頭', han: 2 })
  const han = yaku.reduce((s, y) => s + y.han, 0)
  const dora = doraTile ? tiles14.filter((t) => t === doraTile).length : 0
  const totalHan = han + dora
  const fu = 25
  return {
    valid: true,
    isYakuman: false,
    yaku,
    han,
    dora,
    totalHan,
    fu,
    manganOrAbove: totalHan >= 5 || (totalHan === 4 && fu >= 40) || (totalHan === 3 && fu >= 70),
  }
}

function evaluateKokushi(hand13, winTile) {
  const tiles14 = [...hand13, winTile]
  if (!tiles14.every((t) => KOKUSHI_TILES.has(t))) return null
  const counts = buildCounts(tiles14)
  const kinds = Object.keys(counts)
  if (kinds.length !== 13) return null
  if (!(kinds.filter((k) => counts[k] === 2).length === 1 && kinds.every((k) => counts[k] === 1 || counts[k] === 2))) return null
  return { valid: true, isYakuman: true, yaku: [{ name: '国士無双', han: 13 }], han: 13, dora: 0, totalHan: 13, fu: 30, manganOrAbove: true }
}

// hand13(13枚)がwinTileであがれるかを判定し、最も高い役の組み合わせを返す
export function evaluateWin(hand13, winTile, doraTile) {
  const candidates = []

  const kokushi = evaluateKokushi(hand13, winTile)
  if (kokushi) candidates.push(kokushi)

  const chiitoi = evaluateChiitoitsu(hand13, winTile, doraTile)
  if (chiitoi) candidates.push(chiitoi)

  const tiles14 = [...hand13, winTile]
  const decompositions = allHandDecompositions(tiles14)
  for (const decomp of decompositions) {
    candidates.push(evaluateStandardDecomposition(decomp, winTile, doraTile))
  }

  if (candidates.length === 0) return { valid: false }

  candidates.sort((a, b) => {
    if (a.isYakuman !== b.isYakuman) return a.isYakuman ? -1 : 1
    if (b.totalHan !== a.totalHan) return b.totalHan - a.totalHan
    return b.fu - a.fu
  })
  return candidates[0]
}

// hand13が「あと1枚で満貫以上になる」待ちを少なくとも1つ持っているか
export function tenpaiHasManganWait(hand13, doraTile) {
  const { tenpai, waits } = isTenpai(hand13)
  if (!tenpai) return { ok: false, waits: [] }
  const manganWaits = waits.filter((w) => evaluateWin(hand13, w, doraTile).manganOrAbove)
  return { ok: manganWaits.length > 0, waits, manganWaits }
}
