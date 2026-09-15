import { useEffect, useRef, useState } from 'react'
import { updateRoom, guardedUpdate, addScore } from '../../lib/room.js'
import useTwoPlayerTurns from '../boardShared/useTwoPlayerTurns.js'
import { dealHand, resolveRound, CARD_LABEL, CARD_KANJI } from './ecardLogic.js'

export default function ECard({ code, playerId, room, players, isHost }) {
  const state = room.ecard
  const { first, second, myRole } = useTwoPlayerTurns(players, playerId)
  const [busy, setBusy] = useState(false)
  const resolvingRef = useRef(false)

  useEffect(() => {
    if (isHost && !state && first && second) {
      const roles = { [first.id]: 'emperor', [second.id]: 'slave' }
      updateRoom(code, {
        ecard: {
          handIndex: 0,
          roundIndex: 0,
          roles,
          hands: { [first.id]: dealHand(roles[first.id]), [second.id]: dealHand(roles[second.id]) },
          picks: { [first.id]: null, [second.id]: null },
          phase: 'picking',
          lastRound: null,
        },
      })
    }
  }, [isHost, state, first, second, code])

  // 両者が選び終わったら自動的にめくる(ホストのクライアントが検知して進行)
  useEffect(() => {
    if (!isHost || !state || state.phase !== 'picking') return
    const ids = Object.keys(state.roles)
    if (ids.length < 2) return
    const [idA, idB] = ids
    const cardA = state.picks[idA]
    const cardB = state.picks[idB]
    if (!cardA || !cardB || resolvingRef.current) return
    resolvingRef.current = true
    const result = resolveRound(cardA, cardB)
    const winnerId = result === 'A' ? idA : result === 'B' ? idB : null
    guardedUpdate(code, (data) => data.ecard?.phase === 'picking' && data.ecard?.picks?.[idA] && data.ecard?.picks?.[idB], {
      'ecard.phase': 'revealed',
      'ecard.lastRound': { cardOf: { [idA]: cardA, [idB]: cardB }, winnerId },
    }).finally(() => { resolvingRef.current = false })
  }, [isHost, state, code])

  if (!first || !second) {
    return (
      <div className="card">
        <div className="eyebrow">Eカード</div>
        <div className="title">対戦相手を待っています…</div>
        <p className="subtitle">2人揃うと自動的に始まります。</p>
      </div>
    )
  }

  if (!state) {
    return (
      <div className="card">
        <div className="eyebrow">Eカード</div>
        <div className="title">準備中…</div>
        <p className="subtitle">準備を始めています…</p>
      </div>
    )
  }

  if (myRole === null) {
    return (
      <div className="card">
        <div className="eyebrow">Eカード</div>
        <div className="title">観戦中です</div>
        <p className="subtitle">このゲームは2人プレイ専用です。</p>
      </div>
    )
  }

  const opponent = myRole === 'first' ? second : first
  const opponentId = opponent.id
  const myHand = state.hands[playerId] || []
  const myPick = state.picks[playerId]
  const oppPick = state.picks[opponentId]
  const myRoleLabel = state.roles[playerId]
  const oppRoleLabel = state.roles[opponentId]

  // 同じ種類のカードは枚数表示にまとめる
  const myCounts = {}
  myHand.forEach((c) => { myCounts[c] = (myCounts[c] || 0) + 1 })

  async function pickCard(cardType) {
    if (busy || state.phase !== 'picking' || myPick) return
    if (!myCounts[cardType]) return
    setBusy(true)
    try {
      await updateRoom(code, { [`ecard.picks.${playerId}`]: cardType })
    } finally {
      setBusy(false)
    }
  }

  async function nextRound() {
    if (busy || !isHost || state.phase !== 'revealed') return
    setBusy(true)
    try {
      const { winnerId, cardOf } = state.lastRound
      const ids = Object.keys(state.roles)
      const [idA, idB] = ids
      const newHands = {}
      ids.forEach((pid) => {
        const hand = [...state.hands[pid]]
        const idx = hand.indexOf(cardOf[pid])
        if (idx >= 0) hand.splice(idx, 1)
        newHands[pid] = hand
      })
      const handExhausted = newHands[idA].length === 0
      let patch
      if (handExhausted) {
        const newRoles = {
          [idA]: state.roles[idA] === 'emperor' ? 'slave' : 'emperor',
          [idB]: state.roles[idB] === 'emperor' ? 'slave' : 'emperor',
        }
        patch = {
          'ecard.handIndex': state.handIndex + 1,
          'ecard.roundIndex': 0,
          'ecard.roles': newRoles,
          'ecard.hands': { [idA]: dealHand(newRoles[idA]), [idB]: dealHand(newRoles[idB]) },
          'ecard.picks': { [idA]: null, [idB]: null },
          'ecard.phase': 'picking',
          'ecard.lastRound': null,
        }
      } else {
        patch = {
          'ecard.roundIndex': state.roundIndex + 1,
          'ecard.hands': newHands,
          'ecard.picks': { [idA]: null, [idB]: null },
          'ecard.phase': 'picking',
        }
      }
      if (winnerId) await addScore(code, winnerId, 1)
      await updateRoom(code, patch)
    } finally {
      setBusy(false)
    }
  }

  const badgeClass = (role) => (role === 'emperor' ? 'badge-emperor' : role === 'slave' ? 'badge-slave' : 'badge-citizen')

  return (
    <div className="card">
      <div className="eyebrow">Eカード ・ 第{state.handIndex + 1}手 {state.roundIndex + 1}/5ラウンド</div>
      <div className="title">
        {state.phase === 'revealed'
          ? state.lastRound.winnerId === playerId ? 'あなたの勝ち！' : state.lastRound.winnerId === opponentId ? `${opponent.name} の勝ち` : '引き分け'
          : myPick ? '相手の選択を待っています…' : 'カードを1枚選んでください'}
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        <span className={`badge ${badgeClass(myRoleLabel)}`}>あなた: {CARD_LABEL[myRoleLabel]}側</span>
        <span className={`badge ${badgeClass(oppRoleLabel)}`}>{opponent.name}: {CARD_LABEL[oppRoleLabel]}側</span>
      </div>

      {state.phase === 'picking' && (
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
          {Object.entries(myCounts).map(([type, count]) => (
            <button
              key={type}
              className={`playing-card card-${type} selectable`}
              style={{ border: 'none', padding: 0 }}
              disabled={busy || Boolean(myPick)}
              onClick={() => pickCard(type)}
            >
              <div className={`playing-card card-${type}${myPick === type ? ' is-selected' : ''}`} style={{ width: 64, height: 88, fontSize: 26 }}>
                {CARD_KANJI[type]}
                <span style={{ fontSize: 12, marginTop: 4 }}>×{count}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {state.phase === 'revealed' && (
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', justifyContent: 'center', margin: '16px 0' }}>
          <div style={{ textAlign: 'center' }}>
            <div className={`playing-card card-${state.lastRound.cardOf[playerId]}${state.lastRound.winnerId === playerId ? ' is-selected' : ''}`} style={{ width: 64, height: 88, fontSize: 26, margin: '0 auto' }}>
              {CARD_KANJI[state.lastRound.cardOf[playerId]]}
            </div>
            <p className="subtitle" style={{ marginTop: 6, marginBottom: 0 }}>あなた</p>
          </div>
          <div style={{ fontSize: 20, color: 'var(--text-lo)' }}>VS</div>
          <div style={{ textAlign: 'center' }}>
            <div className={`playing-card card-${state.lastRound.cardOf[opponentId]}${state.lastRound.winnerId === opponentId ? ' is-selected' : ''}`} style={{ width: 64, height: 88, fontSize: 26, margin: '0 auto' }}>
              {CARD_KANJI[state.lastRound.cardOf[opponentId]]}
            </div>
            <p className="subtitle" style={{ marginTop: 6, marginBottom: 0 }}>{opponent.name}</p>
          </div>
        </div>
      )}

      {state.phase === 'revealed' && isHost && (
        <button className="btn btn-amber" style={{ width: '100%' }} disabled={busy} onClick={nextRound}>
          次のラウンドへ
        </button>
      )}

      <p className="subtitle" style={{ marginTop: 16 }}>
        市民は奴隷に勝ち、奴隷は皇帝に勝ち、皇帝は市民に勝ちます。市民同士は引き分けです。
        5ラウンドで手札を使い切ると、役割を入れ替えて次の手が始まります。
      </p>
    </div>
  )
}
