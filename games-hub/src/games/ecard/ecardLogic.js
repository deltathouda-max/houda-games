// カイジのEカードのルールを簡略実装したもの。
// 皇帝1・市民8・奴隷1の計10枚を、皇帝側(皇帝+市民4)と奴隷側(奴隷+市民4)に分けて持つ。
// 三すくみ: 市民は奴隷に勝ち、奴隷は皇帝に勝ち、皇帝は市民に勝つ。市民同士は引き分け。
export function dealHand(role) {
  return role === 'emperor'
    ? ['emperor', 'citizen', 'citizen', 'citizen', 'citizen']
    : ['slave', 'citizen', 'citizen', 'citizen', 'citizen']
}

// cardA・cardBはそれぞれのプレイヤーが出したカード種別を返す。'A' | 'B' | 'draw'
export function resolveRound(cardA, cardB) {
  if (cardA === cardB) return 'draw'
  if (cardA === 'emperor' && cardB === 'citizen') return 'A'
  if (cardA === 'citizen' && cardB === 'emperor') return 'B'
  if (cardA === 'citizen' && cardB === 'slave') return 'A'
  if (cardA === 'slave' && cardB === 'citizen') return 'B'
  if (cardA === 'emperor' && cardB === 'slave') return 'B'
  if (cardA === 'slave' && cardB === 'emperor') return 'A'
  return 'draw'
}

export const CARD_LABEL = { emperor: '皇帝', citizen: '市民', slave: '奴隷' }
export const CARD_KANJI = { emperor: '皇', citizen: '市', slave: '奴' }
