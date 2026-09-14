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
  },
  {
    id: 'othello',
    name: 'オセロ',
    description: '定番の陣取り対戦(2人用)',
    minPlayers: 2,
    maxPlayers: 2,
    component: Othello,
    available: true,
  },
  {
    id: 'hit-and-blow',
    name: 'Hit and Blow',
    description: '3桁の数字を当て合う推理ゲーム(2人用)',
    minPlayers: 2,
    maxPlayers: 2,
    component: HitAndBlow,
    available: true,
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
  },
  {
    id: 'connect-four',
    name: 'コネクトフォー',
    description: '縦・横・斜めに4つ並べたら勝ち(2人用)',
    minPlayers: 2,
    maxPlayers: 2,
    component: ConnectFour,
    available: true,
  },
  {
    id: 'yacht',
    name: 'ヨット',
    description: 'サイコロを振って役を揃える定番ダイスゲーム(2〜6人)',
    minPlayers: 2,
    maxPlayers: 6,
    component: Yacht,
    available: true,
  },
  {
    id: 'chinchiro',
    name: 'チンチロ',
    description: 'サイコロ3つで役を競う伝統のダイスゲーム(2〜6人)',
    minPlayers: 2,
    maxPlayers: 6,
    component: Chinchiro,
    available: true,
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
  },
  {
    id: 'wikipedia-golf',
    name: 'Wikipediaゴルフ',
    description: 'スタートの記事からリンクを辿り、ゴールの記事に一番早く着いた人の勝ち(2人以上)',
    minPlayers: 2,
    maxPlayers: 12,
    component: WikipediaGolf,
    available: true,
  },
]

export function getGame(gameId) {
  return GAMES.find((g) => g.id === gameId) ?? null
}
