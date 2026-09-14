import SoreGaSeikai from './soreGaSeikai/SoreGaSeikai.jsx'
import SoreGaSeikaiLobbySettings from './soreGaSeikai/SoreGaSeikaiLobbySettings.jsx'
import Othello from './othello/Othello.jsx'
import HitAndBlow from './hitAndBlow/HitAndBlow.jsx'
import KyuMasuShogi from './kyuMasuShogi/KyuMasuShogi.jsx'
import KyuMasuShogiLobbySettings from './kyuMasuShogi/KyuMasuShogiLobbySettings.jsx'
import ConnectFour from './connectFour/ConnectFour.jsx'
import Yacht from './yacht/Yacht.jsx'
import Chinchiro from './chinchiro/Chinchiro.jsx'
import WordDrop from './wordDrop/WordDrop.jsx'
import WordDropLobbySettings from './wordDrop/WordDropLobbySettings.jsx'

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
]

export function getGame(gameId) {
  return GAMES.find((g) => g.id === gameId) ?? null
}
