import { useEffect, useMemo } from 'react'
import { updateRoom, addScore } from '../../lib/room.js'
import TurnBoard from '../boardShared/TurnBoard.jsx'
import useTwoPlayerTurns from '../boardShared/useTwoPlayerTurns.js'
import { createInitialBoard, getLegalMoves, applyMove, countDiscs, opponent, SIZE } from './othelloLogic.js'

const DISC = { black: '#1A1E2E', white: '#F4F6FB' }

export default function Othello({ code, playerId, room, players, isHost }) {
  const state = room.othello
  const { first, second, myRole } = useTwoPlayerTurns(players, playerId)

  useEffect(() => {
    if (isHost && !state && players.length >= 2) {
      updateRoom(code, { othello: { board: createInitialBoard(), turn: 'black', winner: null } })
    }
  }, [isHost, state, players.length, code])

  const board = state?.board
  const turn = state?.turn
  const winner = state?.winner
  const myColor = myRole === 'first' ? 'black' : myRole === 'second' ? 'white' : null
  const isMyTurn = Boolean(state) && !winner && myColor === turn
  const legalMoves = useMemo(() => (!state || winner ? [] : getLegalMoves(board, turn)), [state, board, turn, winner])

  if (!state) {
    return (
      <div className="card">
        <div className="eyebrow">オセロ</div>
        <div className="title">準備中…</div>
        <p className="subtitle">2人揃うと自動で始まります。</p>
      </div>
    )
  }

  const { black, white } = countDiscs(board)

  async function handleCellClick(row, col) {
    if (!isMyTurn) return
    const idx = row * SIZE + col
    if (!legalMoves.includes(idx)) return
    const nextBoard = applyMove(board, row, col, myColor)
    const opp = opponent(myColor)
    let nextTurn = opp
    let nextWinner = null
    if (getLegalMoves(nextBoard, opp).length === 0) {
      if (getLegalMoves(nextBoard, myColor).length === 0) {
        const { black: b2, white: w2 } = countDiscs(nextBoard)
        nextWinner = b2 === w2 ? 'draw' : b2 > w2 ? 'black' : 'white'
        nextTurn = null
      } else {
        nextTurn = myColor // 相手に合法手がないため、続けて自分の番
      }
    }
    await updateRoom(code, { othello: { board: nextBoard, turn: nextTurn, winner: nextWinner } })
    if (nextWinner && nextWinner !== 'draw') {
      const winnerPlayer = nextWinner === 'black' ? first : second
      if (winnerPlayer) await addScore(code, winnerPlayer.id, 1)
    }
  }

  return (
    <div className="card">
      <div className="eyebrow">オセロ</div>
      <div className="title">
        {winner
          ? winner === 'draw' ? '引き分け' : `${winner === 'black' ? first?.name : second?.name} の勝ち！`
          : isMyTurn ? 'あなたの番です' : `${turn === 'black' ? first?.name ?? '黒' : second?.name ?? '白'} の番です`}
      </div>
      <p className="subtitle">⚫ {first?.name ?? '?'}: {black}　⚪ {second?.name ?? '?'}: {white}</p>

      <TurnBoard
        rows={SIZE}
        cols={SIZE}
        cellPx={36}
        onCellClick={handleCellClick}
        renderCell={(r, c) => {
          const idx = r * SIZE + c
          const v = board[idx]
          if (v) {
            return <div key={v} className="board-piece" style={{ width: '78%', height: '78%', borderRadius: '50%', background: DISC[v], border: '1px solid var(--dq-border-dim)' }} />
          }
          if (isMyTurn && legalMoves.includes(idx)) {
            return <div className="board-piece" style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--amber-500)', opacity: 0.6 }} />
          }
          return null
        }}
      />

      {myRole === null && !winner && (
        <p className="subtitle" style={{ marginTop: 12 }}>観戦中です(このゲームは2人プレイ専用)</p>
      )}
    </div>
  )
}
