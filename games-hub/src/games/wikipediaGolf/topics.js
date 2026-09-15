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
  { start: 'パンダ', goal: '宇宙船' },
  { start: '忍者', goal: '石油' },
  { start: '温泉', goal: 'スマートフォン' },
  { start: 'ビール', goal: '万里の長城' },
  { start: '花火', goal: '経済学' },
  { start: '地震', goal: 'チーズ' },
  { start: 'カメラ', goal: 'エジプト' },
  { start: '深海魚', goal: 'ピラミッド' },
  { start: 'マラソン', goal: '化学' },
  { start: '神社', goal: '電子レンジ' },
  { start: 'サムライ', goal: '冷蔵庫' },
  { start: 'カブトムシ', goal: '銀行' },
  { start: 'クジラ', goal: '政治' },
  { start: '折り紙', goal: 'ロシア' },
  { start: 'パスタ', goal: '台風' },
  { start: '桃太郎', goal: 'ハンバーガー' },
  { start: 'タコ', goal: '選挙' },
  { start: '京都', goal: 'DNA' },
]

// 直前と同じ組み合わせが連続で出ないようにする(スロット演出中も含めて
// 「同じのばっかり出る」体感を減らす)
let lastPair = null

export function drawPair() {
  if (PAIRS.length <= 1) return PAIRS[0]
  let pair
  do {
    pair = PAIRS[Math.floor(Math.random() * PAIRS.length)]
  } while (pair === lastPair)
  lastPair = pair
  return pair
}
