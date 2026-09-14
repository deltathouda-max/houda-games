import { useEffect } from 'react'
import { updateRoom, addScore } from '../../lib/room.js'
import TurnBoard from '../boardShared/TurnBoard.jsx'
import useTwoPlayerTurns from '../boardShared/useTwoPlayerTurns.js'
import { createInitialState, lowestEmptyRow, applyDrop, COLS, ROWS } from './connectFourLogic.js'

const DISC = { first: '#1A1E2E', second: '#F4F6FB' }

export default function ConnectFour({ code, playerId, room, players, isHost }) {
  const state = room.connectFour
  const { first, second, myRole } = useTwoPlayerTurns(players, playerId)

  useEffect(() => {
    if (isHost && !state && players.length >= 2) {
      updateRoom(code, { connectFour: createInitialState() })
    }
  }, [isHost, state, players.length, code])

  if (!state) {
    return (
      <div className="card">
        <div className="eyebrow">コネクトフォー</div>
        <div className="title">準備中…</div>
        <p className="subtitle">2人揃うと自動で始まります。</p>
      </div>
    )
  }
  if (myRole === null) {
    return (
      <div className="card">
        <div className="eyebrow">コネクトフォー</div>
        <div className="title">観戦中です</div>
        <p className="subtitle">このゲームは2人プレイ専用です。</p>
      </div>
    )
  }

  const isMyTurn = !state.winner && state.turn === myRole

  async function handleDrop(col) {
    if (!isMyTurn) return
    if (lowestEmptyRow(state.board, col) < 0) return
    const next = applyDrop(state, col)
    await updateRoom(code, { connectFour: next })
    if (next.winner && next.winner !== 'draw') {
      const winnerPlayer = next.winner === 'first' ? first : second
      if (winnerPlayer) await addScore(code, winnerPlayer.id, 1)
    }
  }

  return (
    <div className="card">
      <div className="eyebrow">コネクトフォー</div>
      <div className="title">
        {state.winner === 'draw'
          ? '引き分け'
          : state.winner
            ? state.winner === myRole ? 'あなたの勝ち！' : `${(state.winner === 'first' ? first : second)?.name ?? '相手'} の勝ち`
            : isMyTurn ? 'あなたの番です' : `${(state.turn === 'first' ? first : second)?.name ?? '相手'} の番です`}
      </div>
      <p className="subtitle">⚫ {first?.name ?? '?'}　⚪ {second?.name ?? '?'}</p>

      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${COLS}, 36px)`, gap: 4, width: 'fit-content', margin: '0 auto 4px' }}>
        {Array.from({ length: COLS }, (_, c) => {
          const full = lowestEmptyRow(state.board, c) < 0
          return (
            <button
              key={c}
              onClick={() => handleDrop(c)}
              disabled={!isMyTurn || full}
              style={{
                width: 36, height: 28, borderRadius: 6, border: 'none',
                background: isMyTurn && !full ? 'var(--amber-500)' : 'var(--navy-700)',
                color: isMyTurn && !full ? '#241400' : 'var(--text-lo)',
                cursor: isMyTurn && !full ? 'pointer' : 'not-allowed',
                fontWeight: 700,
              }}
            >▼</button>
          )
        })}
      </div>

      <TurnBoard
        rows={ROWS}
        cols={COLS}
        cellPx={36}
        renderCell={(r, c) => {
          const owner = state.board[r * COLS + c]
          if (!owner) return null
          return <div style={{ width: '80%', height: '80%', borderRadius: '50%', background: DISC[owner], border: '1px solid var(--navy-600)' }} />
        }}
      />
    </div>
  )
}
