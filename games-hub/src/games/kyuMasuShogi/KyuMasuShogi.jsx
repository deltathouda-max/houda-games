import { useEffect, useState } from 'react'
import { updateRoom, addScore } from '../../lib/room.js'
import TurnBoard from '../boardShared/TurnBoard.jsx'
import useTwoPlayerTurns from '../boardShared/useTwoPlayerTurns.js'
import { createInitialState, legalMoveTargets, canDropAt, applyMove, applyDrop, pieceLabel, SIZE } from './kyuMasuShogiLogic.js'

const OWNER_STYLE = {
  first: { bg: '#1A1E2E', fg: '#F4F6FB' },
  second: { bg: '#F4F6FB', fg: '#1A1E2E' },
}

export default function KyuMasuShogi({ code, playerId, room, players, isHost }) {
  const state = room.kyuShogi
  const { first, second, myRole } = useTwoPlayerTurns(players, playerId)
  const [selected, setSelected] = useState(null) // null | {type:'board', r, c} | {type:'hand', kind}

  useEffect(() => {
    if (isHost && !state && players.length >= 1) {
      updateRoom(code, { kyuShogi: createInitialState(room.settings?.shogiPreset) })
    }
  }, [isHost, state, players.length, code, room.settings?.shogiPreset])

  useEffect(() => { setSelected(null) }, [state?.turn, state?.winner])

  if (!state) {
    return (
      <div className="card">
        <div className="eyebrow">9マス将棋</div>
        <div className="title">準備中…</div>
        <p className="subtitle">準備を始めています…</p>
      </div>
    )
  }
  if (myRole === null) {
    return (
      <div className="card">
        <div className="eyebrow">9マス将棋</div>
        <div className="title">観戦中です</div>
        <p className="subtitle">このゲームは2人プレイ専用です。</p>
      </div>
    )
  }

  const isMyTurn = !state.winner && state.turn === myRole
  const legalTargets = selected?.type === 'board' && isMyTurn ? legalMoveTargets(state, selected.r, selected.c) : []
  const myHand = state.hands[myRole] || []

  async function writeNext(next) {
    await updateRoom(code, { kyuShogi: next })
    if (next.winner) {
      const winnerPlayer = next.winner === 'first' ? first : second
      if (winnerPlayer) await addScore(code, winnerPlayer.id, 1)
    }
  }

  function handleCellClick(r, c) {
    if (!isMyTurn) return
    const piece = state.board[r * SIZE + c]

    if (selected?.type === 'hand') {
      if (!piece && canDropAt(state, myRole, selected.kind, r, c)) {
        writeNext(applyDrop(state, myRole, selected.kind, r, c))
      }
      setSelected(null)
      return
    }

    if (selected?.type === 'board') {
      if (selected.r === r && selected.c === c) { setSelected(null); return }
      if (legalTargets.some(([tr, tc]) => tr === r && tc === c)) {
        writeNext(applyMove(state, [selected.r, selected.c], [r, c]))
        return
      }
      if (piece && piece.owner === myRole) { setSelected({ type: 'board', r, c }); return }
      setSelected(null)
      return
    }

    if (piece && piece.owner === myRole) setSelected({ type: 'board', r, c })
  }

  function handleHandClick(kind) {
    if (!isMyTurn) return
    setSelected((prev) => (prev?.type === 'hand' && prev.kind === kind ? null : { type: 'hand', kind }))
  }

  function renderHand(role, player) {
    const hand = state.hands[role] || []
    return (
      <div style={{ marginBottom: 8 }}>
        <span style={{ fontSize: 12, color: 'var(--text-lo)' }}>{player?.name ?? '?'} の持ち駒: </span>
        {hand.length === 0 && <span style={{ fontSize: 12, color: 'var(--text-lo)' }}>なし</span>}
        {hand.map((kind, i) => {
          const st = OWNER_STYLE[role]
          const selectable = role === myRole && isMyTurn
          const isSelected = selected?.type === 'hand' && selected.kind === kind && role === myRole
          return (
            <span
              key={i}
              onClick={() => selectable && handleHandClick(kind)}
              style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                width: 28, height: 28, borderRadius: 6, margin: '0 3px',
                background: st.bg, color: st.fg, fontSize: 14, fontWeight: 700,
                cursor: selectable ? 'pointer' : 'default',
                border: isSelected ? '2px solid var(--amber-500)' : '1px solid var(--dq-border-dim)',
              }}
            >
              {pieceLabel({ kind, promoted: false, owner: role })}
            </span>
          )
        })}
      </div>
    )
  }

  return (
    <div className="card">
      <div className="eyebrow">9マス将棋</div>
      <div className="title">
        {state.winner
          ? state.winner === myRole ? 'あなたの勝ち！' : `${(state.winner === 'first' ? first : second)?.name ?? '相手'} の勝ち`
          : isMyTurn ? 'あなたの番です' : `${(state.turn === 'first' ? first : second)?.name ?? '相手'} の番です`}
      </div>

      {renderHand('second', second)}

      <TurnBoard
        rows={SIZE}
        cols={SIZE}
        cellPx={64}
        onCellClick={handleCellClick}
        renderCell={(r, c) => {
          const piece = state.board[r * SIZE + c]
          const isSelected = selected?.type === 'board' && selected.r === r && selected.c === c
          const isTarget = legalTargets.some(([tr, tc]) => tr === r && tc === c)
          if (piece) {
            const st = OWNER_STYLE[piece.owner]
            return (
              <div className="board-piece" style={{
                width: '82%', height: '82%', borderRadius: 8,
                background: st.bg, color: st.fg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 22, fontWeight: 700,
                border: isSelected ? '2px solid var(--amber-500)' : `1px solid ${piece.owner === 'first' ? '#000' : '#ccc'}`,
                transform: piece.owner === 'second' ? 'rotate(180deg)' : 'none',
              }}>
                {pieceLabel(piece)}
              </div>
            )
          }
          if (isTarget) return <div className="board-piece" style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--amber-500)', opacity: 0.6 }} />
          return null
        }}
      />

      {renderHand('first', first)}

      <p className="subtitle" style={{ marginTop: 12 }}>持ち駒をタップしてから空きマスをタップすると打てます(二歩は禁止)。</p>
    </div>
  )
}
