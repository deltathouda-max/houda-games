// ランダムお題用のスタート/ゴール記事ペア。どちらも一般的な記事同士で、
// リンクを数回辿れば繋がる程度の組み合わせを選んである。
const PAIRS = [
  { start: '猫', goal: '宇宙' },
  { start: 'カレーライス', goal: 'フランス革命' },
  { start: '富士山', goal: 'インターネット' },
  { start: '寿司', goal: 'アメリカ合衆国大統領' },
  { start: 'サッカー', goal: '恐竜' },
  { start: '東京タワー', goal: 'チョコレート' },
  { start: 'ピアノ', goal: '火山' },
  { start: '新幹線', goal: 'ノーベル賞' },
  { start: 'ラーメン', goal: '月' },
  { start: '桜', goal: '株式会社' },
  { start: 'コーヒー', goal: 'オリンピック' },
  { start: '将棋', goal: 'パリ' },
]

export function drawPair() {
  return PAIRS[Math.floor(Math.random() * PAIRS.length)]
}
