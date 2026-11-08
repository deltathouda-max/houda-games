// サンレンタン: 出題者(親)が選択肢7つから上位3つを決め、他のプレイヤーが1〜3位を当てる

export const POINTS = {
  sanrentan: 6, // 選択肢も順位も3つとも一致
  sanrenpuku: 4, // 選択肢3つが一致(順位は問わない)
  nirentan: 3, // 1位と2位が一致(3位は違う)
  pukupuku: 2, // 順位を問わず2つの選択肢が一致
  tan: 1, // 1つの選択肢だけ一致
  miss: 0,
}

export const LABELS = {
  sanrentan: 'サンレンタン',
  sanrenpuku: 'サンレンプク',
  nirentan: 'ニレンタン',
  pukupuku: 'プクプク',
  tan: 'タン',
  miss: 'はずれ',
}

// answer, guess: 選択肢のインデックス3つ(順位順)。得点の高い判定を1つだけ採用する
export function judge(answer, guess) {
  if (!Array.isArray(answer) || !Array.isArray(guess) || answer.length !== 3 || guess.length !== 3) {
    return { kind: 'miss', points: 0 }
  }
  const common = guess.filter((g) => answer.includes(g)).length
  let kind = 'miss'
  if (answer.every((a, i) => a === guess[i])) kind = 'sanrentan'
  else if (common === 3) kind = 'sanrenpuku'
  else if (answer[0] === guess[0] && answer[1] === guess[1]) kind = 'nirentan'
  else if (common === 2) kind = 'pukupuku'
  else if (common === 1) kind = 'tan'
  return { kind, points: POINTS[kind] }
}

// 3つとも異なる、0〜6の整数か
export function isValidPick(pick) {
  return Array.isArray(pick)
    && pick.length === 3
    && pick.every((n) => Number.isInteger(n) && n >= 0 && n <= 6)
    && new Set(pick).size === 3
}

// log: { [roundIndex]: { parentId, answer, guesses: { [playerId]: pick } } } から累計点を出す
export function totalsFromLog(log) {
  const totals = {}
  Object.values(log || {}).forEach((r) => {
    Object.entries(r.guesses || {}).forEach(([pid, pick]) => {
      totals[pid] = (totals[pid] || 0) + judge(r.answer, pick).points
    })
  })
  return totals
}
