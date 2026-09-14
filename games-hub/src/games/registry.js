import { lazy } from 'react'

// 各ゲームは遊ばれるまで読み込まなくて良いので、動的importで初回ロードを軽くする
const SoreGaSeikai = lazy(() => import('./soreGaSeikai/SoreGaSeikai.jsx'))
const SoreGaSeikaiLobbySettings = lazy(() => import('./soreGaSeikai/SoreGaSeikaiLobbySettings.jsx'))
const Othello = lazy(() => import('./othello/Othello.jsx'))
const HitAndBlow = lazy(() => import('./hitAndBlow/HitAndBlow.jsx'))
const KyuMasuShogi = lazy(() => import('./kyuMasuShogi/KyuMasuShogi.jsx'))
const KyuMasuShogiLobbySettings = lazy(() => import('./kyuMasuShogi/KyuMasuShogiLobbySettings.jsx'))
const ConnectFour = lazy(() => import('./connectFour/ConnectFour.jsx'))
const Yacht = lazy(() => import('./yacht/Yacht.jsx'))
const Chinchiro = lazy(() => import('./chinchiro/Chinchiro.jsx'))
const WordDrop = lazy(() => import('./wordDrop/WordDrop.jsx'))
const WordDropLobbySettings = lazy(() => import('./wordDrop/WordDropLobbySettings.jsx'))
const WikipediaGolf = lazy(() => import('./wikipediaGolf/WikipediaGolf.jsx'))

// 今後オセロ・hit and blow等を追加する際はここに登録するだけでハブ・ロビーから遊べるようにする
export const GAMES = [
  {
    id: 'sore-ga-seikai',
    name: '激論！朝までそれ正解！',
    description: 'お題に一言で回答し、みんなで一番おもしろい答えを選ぶ',
    minPlayers: 3,
    maxPlayers: 12,
    component: SoreGaSeikai,
    lobbySettings: SoreGaSeikaiLobbySettings,
    available: true,
    rules: '出されたお題に、全員が一言で回答します。\n全員が回答し終わる(または時間切れになる)と、回答が公開されます。\nホストが「これが正解!」と思う回答を選ぶと、その人に1ポイント入ります。\n一番おもしろい・気の利いた回答を選ぶのが盛り上がりのコツです。',
  },
  {
    id: 'othello',
    name: 'オセロ',
    description: '定番の陣取り対戦(2人用)',
    minPlayers: 2,
    maxPlayers: 2,
    component: Othello,
    available: true,
    rules: '黒と白が交互に石を置き、相手の石を挟むと自分の色にひっくり返せます。\n置ける場所がない場合はパスになります。\n盤面が全て埋まったら、自分の色の石が多い方の勝ちです。',
  },
  {
    id: 'hit-and-blow',
    name: 'Hit and Blow',
    description: '3桁の数字を当て合う推理ゲーム(2人用)',
    minPlayers: 2,
    maxPlayers: 2,
    component: HitAndBlow,
    available: true,
    rules: 'お互い、重複のない3桁の数字を秘密で決めます。\n交互に相手の数字を予想して回答し、桁と数字の両方が合っていれば「Hit」、\n数字は合っているが桁が違えば「Blow」の数で結果が返ってきます。\n先に3Hit(完全一致)させた方の勝ちです。',
  },
  {
    id: 'kyu-masu-shogi',
    name: '9マス将棋',
    description: '3×3の盤で将棋の駒を動かす対戦(2人用)',
    minPlayers: 2,
    maxPlayers: 2,
    component: KyuMasuShogi,
    lobbySettings: KyuMasuShogiLobbySettings,
    available: true,
    rules: '3×3の小さな盤で、将棋の駒を交互に動かします。\n取った相手の駒は、自分の持ち駒として盤に打つことができます。\n相手の王(玉)を取ったら勝ちです。',
  },
  {
    id: 'connect-four',
    name: 'コネクトフォー',
    description: '縦・横・斜めに4つ並べたら勝ち(2人用)',
    minPlayers: 2,
    maxPlayers: 2,
    component: ConnectFour,
    available: true,
    rules: '交互に自分の色の石を列に落とします。\n石は一番下から積み上がっていきます。\n縦・横・斜めのいずれかに自分の色の石を4つ連続で並べたら勝ちです。',
  },
  {
    id: 'yacht',
    name: 'ヨット',
    description: 'サイコロを振って役を揃える定番ダイスゲーム(2〜6人)',
    minPlayers: 2,
    maxPlayers: 6,
    component: Yacht,
    available: true,
    rules: 'サイコロ5つを最大3回まで振り直しながら、役を揃えていきます。\n1ラウンドに1つの役を選んで得点を確定させ、全ての役を埋め終えたら\n合計得点が一番高い人の勝ちです。',
  },
  {
    id: 'chinchiro',
    name: 'チンチロ',
    description: 'サイコロ3つで役を競う伝統のダイスゲーム(2〜6人)',
    minPlayers: 2,
    maxPlayers: 6,
    component: Chinchiro,
    available: true,
    rules: '親から順番にサイコロ3つを振り、出た目の役(ゾロ目・シゴロ・ヒフミ等)を競います。\n役の強さで勝敗が決まる、日本の伝統的なダイスゲームです。',
  },
  {
    id: 'word-drop',
    name: 'ワード落とし',
    description: '親だけがお題を知り、会話にさりげなく混ぜる。子はそれを聞いて推理する(3人以上)',
    minPlayers: 3,
    maxPlayers: 12,
    component: WordDrop,
    lobbySettings: WordDropLobbySettings,
    available: true,
    rules: '親(お題を知っている人)だけにお題の単語が表示されます。\n親は制限時間内に、みんなとの会話にそのお題をさりげなく混ぜ込みます。\n子(親以外)は会話をヒントに、お題が何だったかを推理して回答します。\n正解の判定や採点はなく、答え合わせをして楽しむゲームです。',
  },
  {
    id: 'wikipedia-golf',
    name: 'Wikipediaゴルフ',
    description: 'スタートの記事からリンクを辿り、ゴールの記事に一番早く着いた人の勝ち(2人以上)',
    minPlayers: 2,
    maxPlayers: 12,
    component: WikipediaGolf,
    available: true,
    rules: 'スタートの記事が表示されるので、記事内のリンクをクリックして次の記事へ移動していきます。\nリンクを辿って、指定されたゴールの記事に一番早くたどり着いた人の勝ちです。\nクリック数はリーダーボードで他の人にも見えています。',
  },
]

export function getGame(gameId) {
  return GAMES.find((g) => g.id === gameId) ?? null
}
