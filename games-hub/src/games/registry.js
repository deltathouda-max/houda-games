import SoreGaSeikai from './soreGaSeikai/SoreGaSeikai.jsx'
import Othello from './othello/Othello.jsx'

// 今後オセロ・hit and blow等を追加する際はここに登録するだけでハブ・ロビーから遊べるようにする
export const GAMES = [
  {
    id: 'sore-ga-seikai',
    name: 'それが正解',
    description: 'お題に一言で回答し、みんなで一番おもしろい答えを選ぶ',
    minPlayers: 3,
    maxPlayers: 12,
    component: SoreGaSeikai,
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
    description: '準備中',
    minPlayers: 2,
    maxPlayers: 2,
    component: null,
    available: false,
  },
]

export function getGame(gameId) {
  return GAMES.find((g) => g.id === gameId) ?? null
}
