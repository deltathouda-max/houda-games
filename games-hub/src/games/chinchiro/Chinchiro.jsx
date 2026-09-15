import { useEffect, useRef, useState } from 'react'
import { updateRoom, addScore } from '../../lib/room.js'
import { rollDice, classify } from './chinchiroLogic.js'

export default function Chinchiro({ code, playerId, room, players, isHost }) {
  const state = room.chinchiro
  const [isRolling, setIsRolling] = useState(false)
  const [rollingDisplay, setRollingDisplay] = useState(null)
  const rollTimerRef = useRef(null)

  useEffect(() => () => { if (rollTimerRef.current) clearInterval(rollTimerRef.current) }, [])

  useEffect(() => {
    if (isHost && !state && players.length >= 1) {
      const order = players.map((p) => p.id)
      const hands = {}
      order.forEach((pid) => { hands[pid] = null })
      updateRoom(code, {
        chinchiro: { order, turnIndex: 0, rollsUsed: 0, currentDice: [1, 1, 1], hands, phase: 'rolling', roundWinnerId: null },
      })
    }
  }, [isHost, state, players, code])

  if (!state) {
    return (
      <div className="card">
        <div className="eyebrow">チンチロ</div>
        <div className="title">準備中…</div>
        <p className="subtitle">準備を始めています…</p>
      </div>
    )
  }

  const nameOf = (pid) => players.find((p) => p.id === pid)?.name ?? '?'
  const activeId = state.order[state.turnIndex]
  const isMyTurn = state.phase === 'rolling' && activeId === playerId

  async function handleRoll() {
    if (!isMyTurn || isRolling) return
    setIsRolling(true)
    let ticks = 0
    rollTimerRef.current = setInterval(() => {
      setRollingDisplay([1, 2, 3].map(() => Math.floor(Math.random() * 6) + 1))
      ticks += 1
      if (ticks >= 7) clearInterval(rollTimerRef.current)
    }, 90)
    await new Promise((resolve) => setTimeout(resolve, 650))
    clearInterval(rollTimerRef.current)
    setRollingDisplay(null)
    setIsRolling(false)

    const dice = rollDice(3)
    const result = classify(dice)
    if (result.label === '目なし' && state.rollsUsed + 1 < 3) {
      await updateRoom(code, { 'chinchiro.currentDice': dice, 'chinchiro.rollsUsed': state.rollsUsed + 1 })
      return
    }
    const hands = { ...state.hands, [playerId]: { dice, label: result.label, rank: result.rank } }
    const nextIndex = state.turnIndex + 1
    if (nextIndex >= state.order.length) {
      const ranked = state.order.map((pid) => [pid, hands[pid].rank])
      const max = Math.max(...ranked.map(([, r]) => r))
      const winners = ranked.filter(([, r]) => r === max)
      const roundWinnerId = winners.length === 1 ? winners[0][0] : null
      await updateRoom(code, {
        'chinchiro.hands': hands,
        'chinchiro.currentDice': dice,
        'chinchiro.turnIndex': nextIndex,
        'chinchiro.phase': 'roundOver',
        'chinchiro.roundWinnerId': roundWinnerId,
      })
      if (roundWinnerId) await addScore(code, roundWinnerId, 1)
    } else {
      await updateRoom(code, {
        'chinchiro.hands': hands,
        'chinchiro.currentDice': dice,
        'chinchiro.turnIndex': nextIndex,
        'chinchiro.rollsUsed': 0,
      })
    }
  }

  async function nextRound() {
    const order = [...state.order.slice(1), state.order[0]]
    const hands = {}
    order.forEach((pid) => { hands[pid] = null })
    await updateRoom(code, {
      chinchiro: { order, turnIndex: 0, rollsUsed: 0, currentDice: [1, 1, 1], hands, phase: 'rolling', roundWinnerId: null },
    })
  }

  return (
    <div className="card">
      <div className="eyebrow">チンチロ</div>
      <div className="title">
        {state.phase === 'roundOver'
          ? state.roundWinnerId ? `${nameOf(state.roundWinnerId)} の勝ち！` : '引き分け'
          : isMyTurn ? 'あなたの番です' : `${nameOf(activeId)} の番です`}
      </div>

      {state.phase === 'rolling' && (
        <>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', margin: '16px 0' }}>
            {state.currentDice.map((d, i) => (
              <div
                key={`${i}-${state.turnIndex}-${state.rollsUsed}`}
                className="dice-rolling"
                style={{
                  width: 48, height: 48, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 22, fontWeight: 800, background: 'var(--dq-window)', border: '1px solid var(--dq-border-dim)',
                }}
              >
                {isRolling && rollingDisplay ? rollingDisplay[i] : d}
              </div>
            ))}
          </div>
          {isMyTurn && (
            <button className="btn btn-amber" style={{ width: '100%' }} disabled={isRolling} onClick={handleRoll}>
              {isRolling ? '振っています…' : `サイコロを振る(${state.rollsUsed + 1}投目)`}
            </button>
          )}
        </>
      )}

      {state.phase === 'roundOver' && isHost && (
        <button className="btn btn-amber" style={{ width: '100%', marginBottom: 12 }} onClick={nextRound}>次のラウンドへ</button>
      )}

      <div style={{ marginTop: 16 }}>
        {state.order.map((pid) => {
          const hand = state.hands[pid]
          const isWinner = state.phase === 'roundOver' && state.roundWinnerId === pid
          return (
            <div key={pid} className={`answer-row${isWinner ? ' winner' : ''}`}>
              <strong>{nameOf(pid)}</strong>: {hand ? `${hand.dice.join('-')} → ${hand.label}` : pid === activeId && state.phase === 'rolling' ? '挑戦中…' : '順番待ち'}
              {isWinner && ' 🏆'}
            </div>
          )
        })}
      </div>

      <p className="subtitle" style={{ marginTop: 12 }}>強さ: ピンゾロ &gt; ゾロ目 &gt; シゴロ(4-5-6) &gt; 目(6の目が最強) &gt; 目なし &gt; ヒフミ(1-2-3、自動的に負け)</p>
    </div>
  )
}
