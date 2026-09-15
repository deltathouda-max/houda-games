import { useEffect, useRef, useState } from 'react'
import { updateRoom, guardedUpdate, addScore } from '../../lib/room.js'
import useTwoPlayerTurns from '../boardShared/useTwoPlayerTurns.js'
import { INITIAL_CHIPS, ANTE, BET, randomCard, rankLabel, compareCards } from './onePokerLogic.js'

function dealNewHand(dealerId, otherId, chips) {
  const ante = { [dealerId]: Math.min(ANTE, chips[dealerId]), [otherId]: Math.min(ANTE, chips[otherId]) }
  const nextChips = { [dealerId]: chips[dealerId] - ante[dealerId], [otherId]: chips[otherId] - ante[otherId] }
  const pot = ante[dealerId] + ante[otherId]
  return {
    dealerId,
    chips: nextChips,
    pot,
    cards: { [dealerId]: [randomCard(), randomCard()], [otherId]: [randomCard(), randomCard()] },
    finalCard: { [dealerId]: null, [otherId]: null },
    hint: { [dealerId]: null, [otherId]: null },
    phase: 'choosing',
    turnPlayerId: null,
    betAmount: 0,
    lastAction: null,
    result: null,
  }
}

export default function OnePoker({ code, playerId, room, players, isHost }) {
  const state = room.onePoker
  const { first, second, myRole } = useTwoPlayerTurns(players, playerId)
  const [busy, setBusy] = useState(false)
  const resolvingRef = useRef(false)

  useEffect(() => {
    if (isHost && !state && first && second) {
      const chips = { [first.id]: INITIAL_CHIPS, [second.id]: INITIAL_CHIPS }
      updateRoom(code, { onePoker: { ...dealNewHand(first.id, second.id, chips), handIndex: 0, winnerId: null } })
    }
  }, [isHost, state, first, second, code])

  // 両者が最終カードを選び終わったらヒント(UP/DOWN)を計算してベッティングへ
  useEffect(() => {
    if (!isHost || !state || state.phase !== 'choosing' || resolvingRef.current) return
    const ids = [state.dealerId, otherIdOf(state)]
    const [idA, idB] = ids
    const cardA = state.finalCard[idA]
    const cardB = state.finalCard[idB]
    if (!cardA || !cardB) return
    resolvingRef.current = true
    const result = compareCards(cardA, cardB)
    const hintA = result === 'A' ? 'up' : result === 'B' ? 'down' : 'even'
    const hintB = result === 'B' ? 'up' : result === 'A' ? 'down' : 'even'
    const firstActorId = idB === state.dealerId ? idA : idB // ディーラーでない方から先にアクション
    guardedUpdate(code, (data) => data.onePoker?.phase === 'choosing' && data.onePoker?.finalCard?.[idA] && data.onePoker?.finalCard?.[idB], {
      'onePoker.phase': 'betting',
      'onePoker.hint': { [idA]: hintA, [idB]: hintB },
      'onePoker.turnPlayerId': firstActorId,
    }).finally(() => { resolvingRef.current = false })
  }, [isHost, state, code])

  if (!first || !second) {
    return (
      <div className="card">
        <div className="eyebrow">ワン・ポーカー</div>
        <div className="title">対戦相手を待っています…</div>
        <p className="subtitle">2人揃うと自動的に始まります。</p>
      </div>
    )
  }

  if (!state) {
    return (
      <div className="card">
        <div className="eyebrow">ワン・ポーカー</div>
        <div className="title">準備中…</div>
        <p className="subtitle">準備を始めています…</p>
      </div>
    )
  }

  if (myRole === null) {
    return (
      <div className="card">
        <div className="eyebrow">ワン・ポーカー</div>
        <div className="title">観戦中です</div>
        <p className="subtitle">このゲームは2人プレイ専用です。</p>
      </div>
    )
  }

  const opponent = myRole === 'first' ? second : first
  const opponentId = opponent.id

  if (state.phase === 'gameover') {
    return (
      <div className="card">
        <div className="eyebrow">ワン・ポーカー</div>
        <div className="title">{state.winnerId === playerId ? 'あなたの勝ち！' : `${opponent.name} の勝ち`}</div>
        <p className="subtitle">チップがなくなり勝負がつきました。</p>
        {isHost && (
          <button className="btn btn-amber" style={{ width: '100%' }} onClick={restart}>もう一度</button>
        )}
      </div>
    )
  }

  const myChips = state.chips[playerId]
  const oppChips = state.chips[opponentId]
  const myCards = state.cards[playerId] || []
  const myFinal = state.finalCard[playerId]
  const oppFinal = state.finalCard[opponentId]
  const isMyTurn = state.phase === 'betting' && state.turnPlayerId === playerId
  const isMyResponse = state.phase === 'response' && state.turnPlayerId === playerId

  async function chooseFinal(value) {
    if (busy || state.phase !== 'choosing' || myFinal) return
    setBusy(true)
    try {
      await updateRoom(code, { [`onePoker.finalCard.${playerId}`]: value })
    } finally { setBusy(false) }
  }

  async function check() {
    if (busy || !isMyTurn) return
    setBusy(true)
    try {
      if (state.lastAction === null) {
        await updateRoom(code, { 'onePoker.turnPlayerId': opponentId, 'onePoker.lastAction': { type: 'check', by: playerId } })
      } else {
        await goToShowdown()
      }
    } finally { setBusy(false) }
  }

  async function bet() {
    if (busy || !isMyTurn) return
    setBusy(true)
    try {
      const amount = Math.min(BET, myChips)
      await updateRoom(code, {
        [`onePoker.chips.${playerId}`]: myChips - amount,
        'onePoker.pot': state.pot + amount,
        'onePoker.betAmount': amount,
        'onePoker.phase': 'response',
        'onePoker.turnPlayerId': opponentId,
        'onePoker.lastAction': { type: 'bet', by: playerId, amount },
      })
    } finally { setBusy(false) }
  }

  async function fold() {
    if (busy || !isMyResponse) return
    setBusy(true)
    try {
      await resolveHand({ winnerId: opponentId, folded: true })
    } finally { setBusy(false) }
  }

  async function call() {
    if (busy || !isMyResponse) return
    setBusy(true)
    try {
      const amount = Math.min(state.betAmount, myChips)
      const newChips = { ...state.chips, [playerId]: myChips - amount }
      const newPot = state.pot + amount
      await goToShowdown(newChips, newPot)
    } finally { setBusy(false) }
  }

  async function goToShowdown(overrideChips, overridePot) {
    const chips = overrideChips || state.chips
    const pot = overridePot ?? state.pot
    const idA = state.dealerId
    const idB = otherIdOf(state)
    const result = compareCards(state.finalCard[idA], state.finalCard[idB])
    const winnerId = result === 'draw' ? null : result === 'A' ? idA : idB
    await resolveHand({ winnerId, folded: false }, chips, pot)
  }

  async function resolveHand(outcome, overrideChips, overridePot) {
    const chips = { ...(overrideChips || state.chips) }
    const pot = overridePot ?? state.pot
    if (outcome.winnerId) {
      chips[outcome.winnerId] = (chips[outcome.winnerId] || 0) + pot
    } else {
      // 引き分け: 山分け
      const idA = state.dealerId
      const idB = otherIdOf(state)
      const half = Math.floor(pot / 2)
      chips[idA] = (chips[idA] || 0) + half
      chips[idB] = (chips[idB] || 0) + half
    }
    await updateRoom(code, {
      'onePoker.chips': chips,
      'onePoker.pot': 0,
      'onePoker.phase': 'result',
      'onePoker.result': { winnerId: outcome.winnerId, folded: outcome.folded },
    })
  }

  async function nextHand() {
    if (busy || !isHost || state.phase !== 'result') return
    setBusy(true)
    try {
      const idA = state.dealerId
      const idB = otherIdOf(state)
      const [loserId] = Object.entries(state.chips).find(([, c]) => c <= 0) || []
      if (loserId) {
        const winnerId = loserId === idA ? idB : idA
        await updateRoom(code, { 'onePoker.phase': 'gameover', 'onePoker.winnerId': winnerId })
        await addScore(code, winnerId, 1)
        return
      }
      const newDealerId = idB // ディーラーを交代
      const newOtherId = idA
      await updateRoom(code, {
        onePoker: { ...dealNewHand(newDealerId, newOtherId, state.chips), handIndex: state.handIndex + 1, winnerId: null },
      })
    } finally { setBusy(false) }
  }

  async function restart() {
    if (!isHost) return
    const chips = { [first.id]: INITIAL_CHIPS, [second.id]: INITIAL_CHIPS }
    await updateRoom(code, { onePoker: { ...dealNewHand(first.id, second.id, chips), handIndex: 0, winnerId: null } })
  }

  return (
    <div className="card">
      <div className="eyebrow">ワン・ポーカー ・ 第{state.handIndex + 1}ハンド</div>
      <div className="title">
        {state.phase === 'choosing' && (myFinal ? '相手の選択を待っています…' : '最終カードを1枚選んでください')}
        {state.phase === 'betting' && (isMyTurn ? 'あなたの番です' : `${opponent.name} の番です`)}
        {state.phase === 'response' && (isMyResponse ? 'コールかフォールドを選んでください' : `${opponent.name} の判断を待っています…`)}
        {state.phase === 'result' && (
          state.result.folded
            ? (state.result.winnerId === playerId ? 'あなたの勝ち(相手フォールド)' : `${opponent.name} の勝ち(あなたのフォールド)`)
            : state.result.winnerId === null
              ? '引き分け(山分け)'
              : state.result.winnerId === playerId ? 'あなたの勝ち！' : `${opponent.name} の勝ち`
        )}
      </div>

      <div style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
        <span className="chip-count">あなた: {myChips}</span>
        <span className="chip-count">{opponent.name}: {oppChips}</span>
        <span className="chip-count" style={{ color: 'var(--text-mid)' }}>POT: {state.pot}</span>
      </div>

      {state.phase === 'choosing' && (
        <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
          {myCards.map((v, i) => (
            <button key={i} className="playing-card selectable" style={{ border: 'none', padding: 0 }} disabled={busy || Boolean(myFinal)} onClick={() => chooseFinal(v)}>
              <div className={`playing-card${v === 14 ? ' card-high' : v === 2 ? ' card-two' : ''}${myFinal === v ? ' is-selected' : ''}`} style={{ width: 64, height: 88, fontSize: 26 }}>
                {rankLabel(v)}
              </div>
            </button>
          ))}
        </div>
      )}

      {(state.phase === 'betting' || state.phase === 'response') && (
        <>
          <p className="subtitle">あなたの最終カードの手ごたえ: <strong style={{ color: state.hint[playerId] === 'up' ? 'var(--success)' : state.hint[playerId] === 'down' ? 'var(--danger)' : 'var(--text-mid)' }}>{state.hint[playerId] === 'up' ? 'UP(優勢)' : state.hint[playerId] === 'down' ? 'DOWN(劣勢)' : 'EVEN(互角)'}</strong></p>
          {state.lastAction?.type === 'bet' && <p className="subtitle">{state.lastAction.by === playerId ? 'あなた' : opponent.name}が{state.lastAction.amount}ベットしました</p>}
          {isMyTurn && (
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-ghost" style={{ flex: 1 }} disabled={busy} onClick={check}>{state.lastAction ? 'ショーダウンへ' : 'チェック'}</button>
              <button className="btn btn-amber" style={{ flex: 1 }} disabled={busy || myChips <= 0} onClick={bet}>ベット(+{Math.min(BET, myChips)})</button>
            </div>
          )}
          {isMyResponse && (
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-ghost" style={{ flex: 1 }} disabled={busy} onClick={fold}>フォールド</button>
              <button className="btn btn-amber" style={{ flex: 1 }} disabled={busy} onClick={call}>コール(-{Math.min(state.betAmount, myChips)})</button>
            </div>
          )}
        </>
      )}

      {state.phase === 'result' && (
        <>
          {!state.result.folded && (
            <div style={{ display: 'flex', gap: 16, alignItems: 'center', justifyContent: 'center', margin: '16px 0' }}>
              <div style={{ textAlign: 'center' }}>
                <div className={`playing-card${state.result.winnerId === playerId ? ' is-selected' : ''}`} style={{ width: 64, height: 88, fontSize: 26, margin: '0 auto' }}>{rankLabel(myFinal)}</div>
                <p className="subtitle" style={{ marginTop: 6, marginBottom: 0 }}>あなた</p>
              </div>
              <div style={{ fontSize: 20, color: 'var(--text-lo)' }}>VS</div>
              <div style={{ textAlign: 'center' }}>
                <div className={`playing-card${state.result.winnerId === opponentId ? ' is-selected' : ''}`} style={{ width: 64, height: 88, fontSize: 26, margin: '0 auto' }}>{rankLabel(oppFinal)}</div>
                <p className="subtitle" style={{ marginTop: 6, marginBottom: 0 }}>{opponent.name}</p>
              </div>
            </div>
          )}
          {isHost && <button className="btn btn-amber" style={{ width: '100%' }} disabled={busy} onClick={nextHand}>次のハンドへ</button>}
        </>
      )}

      <p className="subtitle" style={{ marginTop: 16 }}>
        カードは2〜Aの順に強く、ただし2はAにだけ勝てる特別ルールがあります。
        チップがなくなったら負けです。
      </p>
    </div>
  )
}

function otherIdOf(state) {
  return Object.keys(state.chips).find((id) => id !== state.dealerId)
}
