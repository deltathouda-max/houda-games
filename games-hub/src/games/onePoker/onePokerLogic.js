// カイジのワン・ポーカーを簡略実装したもの。
// カードは2〜14(11=J,12=Q,13=K,14=A)の強さ順だが、「2はAにだけ勝てる」特別ルールがある。
export const INITIAL_CHIPS = 1000
export const ANTE = 50
export const BET = 50

export function randomCard() {
  return 2 + Math.floor(Math.random() * 13)
}

export function rankLabel(n) {
  if (n === 11) return 'J'
  if (n === 12) return 'Q'
  if (n === 13) return 'K'
  if (n === 14) return 'A'
  return String(n)
}

// cardA・cardBはそれぞれの最終カードの数値。'A' | 'B' | 'draw'
export function compareCards(cardA, cardB) {
  if (cardA === cardB) return 'draw'
  if (cardA === 2 && cardB === 14) return 'A'
  if (cardA === 14 && cardB === 2) return 'B'
  return cardA > cardB ? 'A' : 'B'
}
