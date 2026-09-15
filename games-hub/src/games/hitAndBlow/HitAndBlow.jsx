import { useEffect, useState } from 'react'
import { updateRoom, addScore } from '../../lib/room.js'
import useTwoPlayerTurns from '../boardShared/useTwoPlayerTurns.js'
import { isValidCode, computeHitsBlows } from './hitBlowLogic.js'

export default function HitAndBlow({ code: roomCode, playerId, room, players, isHost }) {
  const state = room.hitBlow
  const { first, second, myRole } = useTwoPlayerTurns(players, playerId)
  const [codeInput, setCodeInput] = useState('')
  const [guessInput, setGuessInput] = useState('')

  useEffect(() => {
    if (isHost && !state && players.length >= 1) {
      updateRoom(roomCode, { hitBlow: { phase: 'setup', codes: {}, turn: null, guesses: {}, winner: null } })
    }
  }, [isHost, state, players.length, roomCode])

  useEffect(() => { setCodeInput(''); setGuessInput('') }, [state?.phase])

  if (!state) {
    return (
      <div className="card">
        <div className="eyebrow">Hit and Blow</div>
        <div className="title">準備中…</div>
        <p className="subtitle">準備を始めています…</p>
      </div>
    )
  }

  const opponentId = myRole === 'first' ? second?.id : myRole === 'second' ? first?.id : null
  const opponent = myRole === 'first' ? second : first
  const codes = state.codes || {}
  const myCodeSet = Boolean(codes[playerId])
  const isMyTurn = state.phase === 'guessing' && state.turn === playerId
  const myGuesses = state.guesses?.[playerId] || []
  const opponentGuesses = (opponentId && state.guesses?.[opponentId]) || []

  async function submitCode() {
    if (!isValidCode(codeInput)) return
    const patch = { [`hitBlow.codes.${playerId}`]: codeInput }
    const nextCodes = { ...codes, [playerId]: codeInput }
    if (first && second && nextCodes[first.id] && nextCodes[second.id]) {
      patch['hitBlow.phase'] = 'guessing'
      patch['hitBlow.turn'] = first.id
    }
    await updateRoom(roomCode, patch)
  }

  async function submitGuess() {
    if (!isValidCode(guessInput) || !opponentId) return
    const { hits, blows } = computeHitsBlows(guessInput, codes[opponentId])
    const nextGuesses = [...myGuesses, { code: guessInput, hits, blows }]
    const patch = { [`hitBlow.guesses.${playerId}`]: nextGuesses }
    if (hits === 3) {
      patch['hitBlow.phase'] = 'done'
      patch['hitBlow.winner'] = playerId
    } else {
      patch['hitBlow.turn'] = opponentId
    }
    await updateRoom(roomCode, patch)
    if (hits === 3) await addScore(roomCode, playerId, 1)
  }

  if (myRole === null) {
    return (
      <div className="card">
        <div className="eyebrow">Hit and Blow</div>
        <div className="title">観戦中です</div>
        <p className="subtitle">このゲームは2人プレイ専用です。</p>
      </div>
    )
  }

  return (
    <div className="card">
      <div className="eyebrow">Hit and Blow</div>

      {state.phase === 'setup' && (
        <>
          <div className="title">{myCodeSet ? '相手の入力を待っています…' : '自分の数字を決めてください'}</div>
          <p className="subtitle">0〜9の中から、重複しない3桁の数字を決めて相手に当てさせます。</p>
          {!myCodeSet && (
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                className="input"
                value={codeInput}
                onChange={(e) => setCodeInput(e.target.value.replace(/\D/g, '').slice(0, 3))}
                placeholder="例: 481"
                inputMode="numeric"
                maxLength={3}
                autoFocus
              />
              <button className="btn btn-amber" disabled={!isValidCode(codeInput)} onClick={submitCode}>決定</button>
            </div>
          )}
        </>
      )}

      {(state.phase === 'guessing' || state.phase === 'done') && (
        <>
          <p className="subtitle">あなたの数字: {codes[playerId]}</p>
          <div className="title">
            {state.phase === 'done'
              ? state.winner === playerId ? 'あなたの勝ち！' : `${opponent?.name ?? '相手'} の勝ち`
              : isMyTurn ? 'あなたの番です' : `${opponent?.name ?? '相手'} の番です`}
          </div>
          {state.phase === 'done' && (
            <p className="subtitle">{opponent?.name ?? '相手'}の数字は {codes[opponentId]} でした</p>
          )}

          {isMyTurn && state.phase === 'guessing' && (
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <input
                className="input"
                value={guessInput}
                onChange={(e) => setGuessInput(e.target.value.replace(/\D/g, '').slice(0, 3))}
                placeholder="相手の数字を予想"
                inputMode="numeric"
                maxLength={3}
                autoFocus
              />
              <button className="btn btn-amber" disabled={!isValidCode(guessInput)} onClick={submitGuess}>決定</button>
            </div>
          )}

          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, color: 'var(--text-lo)', marginBottom: 6 }}>あなたの予想履歴</div>
              {myGuesses.length === 0 && <p className="subtitle" style={{ fontSize: 12 }}>まだ予想していません</p>}
              {[...myGuesses].reverse().map((g, i) => (
                <div key={i} className="answer-row" style={{ padding: '8px 10px', fontSize: 13 }}>
                  {g.code} → {g.hits}H/{g.blows}B
                </div>
              ))}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, color: 'var(--text-lo)', marginBottom: 6 }}>{opponent?.name ?? '相手'}の予想履歴</div>
              {opponentGuesses.length === 0 && <p className="subtitle" style={{ fontSize: 12 }}>まだ予想していません</p>}
              {[...opponentGuesses].reverse().map((g, i) => (
                <div key={i} className="answer-row" style={{ padding: '8px 10px', fontSize: 13 }}>
                  {g.code} → {g.hits}H/{g.blows}B
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
