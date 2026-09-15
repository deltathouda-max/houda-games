import { useEffect, useRef, useState } from 'react'
import { updateRoom, addScore } from '../../lib/room.js'
import { CATEGORIES, computeScore, rollDice, totalScore, emptyScorecard, isScorecardFull } from './yachtLogic.js'

function determineWinner(order, scores) {
  const totals = order.map((pid) => [pid, totalScore(scores[pid])])
  const max = Math.max(...totals.map(([, t]) => t))
  const leaders = totals.filter(([, t]) => t === max)
  return leaders.length === 1 ? leaders[0][0] : null
}

export default function Yacht({ code, playerId, room, players, isHost }) {
  const state = room.yacht
  const [isRolling, setIsRolling] = useState(false)
  const [rollingDisplay, setRollingDisplay] = useState(null)
  const rollTimerRef = useRef(null)

  useEffect(() => () => { if (rollTimerRef.current) clearInterval(rollTimerRef.current) }, [])

  useEffect(() => {
    if (isHost && !state && players.length >= 1) {
      const order = players.map((p) => p.id)
      const scores = {}
      order.forEach((pid) => { scores[pid] = emptyScorecard() })
      updateRoom(code, {
        yacht: { order, turnIndex: 0, dice: [1, 1, 1, 1, 1], held: [false, false, false, false, false], rollsUsed: 0, scores, finished: false, winnerId: null },
      })
    }
  }, [isHost, state, players, code])

  if (!state) {
    return (
      <div className="card">
        <div className="eyebrow">ヨット</div>
        <div className="title">準備中…</div>
        <p className="subtitle">準備を始めています…</p>
      </div>
    )
  }

  const activeId = state.order[state.turnIndex]
  const isMyTurn = !state.finished && activeId === playerId
  const nameOf = (pid) => players.find((p) => p.id === pid)?.name ?? '?'
  const canRoll = isMyTurn && state.rollsUsed < 3
  const canHold = isMyTurn && !isRolling && state.rollsUsed >= 1 && state.rollsUsed < 3
  const canPick = isMyTurn && state.rollsUsed >= 1

  async function handleRoll() {
    if (!canRoll || isRolling) return
    setIsRolling(true)
    const rollingIndices = state.held.map((h, i) => (h ? null : i)).filter((i) => i !== null)
    let ticks = 0
    rollTimerRef.current = setInterval(() => {
      setRollingDisplay((prev) => {
        const next = { ...(prev ?? {}) }
        rollingIndices.forEach((i) => { next[i] = Math.floor(Math.random() * 6) + 1 })
        return next
      })
      ticks += 1
      if (ticks >= 7) clearInterval(rollTimerRef.current)
    }, 90)
    await new Promise((resolve) => setTimeout(resolve, 650))
    clearInterval(rollTimerRef.current)
    setRollingDisplay(null)
    setIsRolling(false)
    const dice = state.dice.map((d, i) => (state.held[i] ? d : rollDice(1)[0]))
    await updateRoom(code, { 'yacht.dice': dice, 'yacht.rollsUsed': state.rollsUsed + 1 })
  }

  async function toggleHold(i) {
    if (!canHold) return
    const held = [...state.held]
    held[i] = !held[i]
    await updateRoom(code, { 'yacht.held': held })
  }

  async function pickCategory(catId) {
    if (!canPick) return
    if (state.scores[playerId][catId] !== null) return
    const score = computeScore(catId, state.dice)
    const scores = { ...state.scores, [playerId]: { ...state.scores[playerId], [catId]: score } }
    const nextIndex = (state.turnIndex + 1) % state.order.length
    const allFull = state.order.every((pid) => isScorecardFull(scores[pid]))
    const winnerId = allFull ? determineWinner(state.order, scores) : null
    await updateRoom(code, {
      'yacht.scores': scores,
      'yacht.turnIndex': nextIndex,
      'yacht.dice': [1, 1, 1, 1, 1],
      'yacht.held': [false, false, false, false, false],
      'yacht.rollsUsed': 0,
      'yacht.finished': allFull,
      'yacht.winnerId': winnerId,
    })
    if (winnerId) await addScore(code, winnerId, 1)
  }

  return (
    <div className="card">
      <div className="eyebrow">ヨット</div>
      <div className="title">
        {state.finished
          ? state.winnerId ? `${nameOf(state.winnerId)} の勝ち！` : '引き分け'
          : isMyTurn ? 'あなたの番です' : `${nameOf(activeId)} の番です`}
      </div>

      {!state.finished && (
        <>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', margin: '12px 0' }}>
            {state.dice.map((d, i) => {
              const showRolling = isRolling && rollingDisplay?.[i] !== undefined
              const displayValue = showRolling ? rollingDisplay[i] : state.rollsUsed === 0 ? '?' : d
              return (
                <div
                  key={state.held[i] ? `held-${i}` : `roll-${i}-${state.rollsUsed}`}
                  onClick={() => toggleHold(i)}
                  className={showRolling || (!state.held[i] && state.rollsUsed > 0) ? 'dice-rolling' : ''}
                  style={{
                    width: 60, height: 60, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 28, fontWeight: 800, cursor: canHold ? 'pointer' : 'default',
                    background: state.held[i] ? 'rgba(245,166,35,0.15)' : 'var(--dq-window)',
                    border: state.held[i] ? '2px solid var(--amber-500)' : '1px solid var(--dq-border-dim)',
                    color: state.rollsUsed === 0 && !showRolling ? 'var(--text-lo)' : 'var(--text-hi)',
                  }}
                >
                  {displayValue}
                </div>
              )
            })}
          </div>
          <p className="subtitle" style={{ textAlign: 'center' }}>
            {canHold && 'サイコロをタップすると固定(キープ)できます。'}
          </p>
          {isMyTurn && (
            <button className="btn btn-amber" style={{ width: '100%', marginBottom: 16 }} disabled={!canRoll || isRolling} onClick={handleRoll}>
              {isRolling ? '振っています…' : canRoll ? `サイコロを振る(残り${3 - state.rollsUsed}回)` : 'これ以上は振れません、役を選んでください'}
            </button>
          )}
        </>
      )}

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '4px 8px', color: 'var(--text-lo)' }}>役</th>
              {state.order.map((pid) => (
                <th key={pid} style={{ padding: '4px 8px', color: pid === activeId && !state.finished ? 'var(--amber-400)' : 'var(--text-mid)' }}>
                  {nameOf(pid)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {CATEGORIES.map((cat) => (
              <tr key={cat.id} style={{ borderTop: '1px solid var(--dq-window)' }}>
                <td style={{ padding: '4px 8px' }}>
                  {isMyTurn && canPick && !isRolling && state.scores[playerId][cat.id] === null ? (
                    <button
                      className="btn btn-ghost"
                      style={{ padding: '4px 10px', fontSize: 12 }}
                      onClick={() => pickCategory(cat.id)}
                    >
                      {cat.label} → {computeScore(cat.id, state.dice)}
                    </button>
                  ) : cat.label}
                </td>
                {state.order.map((pid) => (
                  <td key={pid} style={{ textAlign: 'center', padding: '4px 8px' }}>
                    {state.scores[pid][cat.id] ?? '―'}
                  </td>
                ))}
              </tr>
            ))}
            <tr style={{ borderTop: '2px solid var(--dq-border-dim)', fontWeight: 700 }}>
              <td style={{ padding: '4px 8px' }}>合計</td>
              {state.order.map((pid) => (
                <td key={pid} style={{ textAlign: 'center', padding: '4px 8px', color: 'var(--amber-400)' }}>
                  {totalScore(state.scores[pid])}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
