export function rollDice(count) {
  return Array.from({ length: count }, () => 1 + Math.floor(Math.random() * 6))
}

// 役の強さを1つの数値に変換する。数値が大きいほど強い。
// ピンゾロ(1000) > ゾロ目6〜2(906〜902) > シゴロ(800) > 目6〜1(160〜110) > 目なし(50) > ヒフミ(0, 自動負け)
export function classify(dice) {
  const sorted = [...dice].sort((a, b) => a - b)
  const [a, b, c] = sorted
  if (a === b && b === c) {
    if (a === 1) return { label: 'ピンゾロ', rank: 1000 }
    return { label: `ゾロ目(${a})`, rank: 900 + a }
  }
  if (a === 4 && b === 5 && c === 6) return { label: 'シゴロ', rank: 800 }
  if (a === 1 && b === 2 && c === 3) return { label: 'ヒフミ(負け)', rank: 0 }
  if (a === b || b === c) {
    const me = a === b ? c : a
    return { label: `${me}の目`, rank: 100 + me * 10 }
  }
  return { label: '目なし', rank: 50 }
}

export function isNoYaku(dice) {
  return classify(dice).label === '目なし'
}
