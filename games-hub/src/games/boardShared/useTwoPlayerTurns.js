// 2人対戦ゲーム共通: 参加順で先手・後手を割り当てる(players は既に参加順にソート済み)。
export default function useTwoPlayerTurns(players, playerId) {
  const first = players[0] ?? null
  const second = players[1] ?? null
  const myRole = first?.id === playerId ? 'first' : second?.id === playerId ? 'second' : null
  return { first, second, myRole }
}
