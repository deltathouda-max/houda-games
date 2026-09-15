import { useEffect, useMemo, useState } from 'react'
import { updateRoom, guardedUpdate, addScore } from '../../lib/room.js'
import useTwoPlayerTurns from '../boardShared/useTwoPlayerTurns.js'
import { ALL_TILES, isComplete14, isTenpai, sortTiles, tileLabel, tileSuitClass, ANTE_17HO, MAX_TURNS } from './juunanahoLogic.js'

const CHIPS_17HO = 1000

function startHand(dealerId, otherId, chips) {
  const ante = { [dealerId]: Math.min(ANTE_17HO, chips[dealerId]), [otherId]: Math.min(ANTE_17HO, chips[otherId]) }
  const nextChips = { [dealerId]: chips[dealerId] - ante[dealerId], [otherId]: chips[otherId] - ante[otherId] }
  return {
    dealerId,
    chips: nextChips,
    pot: ante[dealerId] + ante[otherId],
    phase: 'selecting',
    hand: { [dealerId]: null, [otherId]: null },
    discardPool: { [dealerId]: null, [otherId]: null },
    discarded: { [dealerId]: [], [otherId]: [] },
    ready: { [dealerId]: false, [otherId]: false },
    turnPlayerId: dealerId,
    turnCount: 0,
    furiten: { [dealerId]: false, [otherId]: false },
    pendingDiscard: null,
    result: null,
  }
}

function otherIdOf(state) {
  return Object.keys(state.chips).find((id) => id !== state.dealerId)
}

const TILE_ROWS = [
  ALL_TILES.filter((t) => t.endsWith('m')),
  ALL_TILES.filter((t) => t.endsWith('p')),
  ALL_TILES.filter((t) => t.endsWith('s')),
  ALL_TILES.filter((t) => t.endsWith('z')),
]

export default function JuunanaHo({ code, playerId, room, players, isHost }) {
  const state = room.juunanaho
  const { first, second, myRole } = useTwoPlayerTurns(players, playerId)
  const [selected, setSelected] = useState([])
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (isHost && !state && first && second) {
      updateRoom(code, { juunanaho: { ...startHand(first.id, second.id, { [first.id]: CHIPS_17HO, [second.id]: CHIPS_17HO }), handIndex: 0, winnerId: null } })
    }
  }, [isHost, state, first, second, code])

  // 両者の手が確定したら捨て牌フェーズへ
  useEffect(() => {
    if (!isHost || !state || state.phase !== 'selecting') return
    const ids = Object.keys(state.chips)
    const [idA, idB] = ids
    if (!state.ready[idA] || !state.ready[idB]) return
    guardedUpdate(code, (data) => data.juunanaho?.phase === 'selecting' && data.juunanaho?.ready?.[idA] && data.juunanaho?.ready?.[idB], {
      'juunanaho.phase': 'discarding',
    })
  }, [isHost, state, code])

  useEffect(() => { setSelected([]) }, [state?.handIndex])

  const tenpaiInfo = useMemo(() => isTenpai(sortTiles(selected)), [selected])

  if (!first || !second) {
    return (
      <div className="card">
        <div className="eyebrow">17歩</div>
        <div className="title">対戦相手を待っています…</div>
        <p className="subtitle">2人揃うと自動的に始まります。</p>
      </div>
    )
  }

  if (!state) {
    return (
      <div className="card">
        <div className="eyebrow">17歩</div>
        <div className="title">準備中…</div>
        <p className="subtitle">準備を始めています…</p>
      </div>
    )
  }

  if (myRole === null) {
    return (
      <div className="card">
        <div className="eyebrow">17歩</div>
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
        <div className="eyebrow">17歩</div>
        <div className="title">{state.winnerId === playerId ? 'あなたの勝ち！' : `${opponent.name} の勝ち`}</div>
        <p className="subtitle">チップがなくなり勝負がつきました。</p>
        {isHost && <button className="btn btn-amber" style={{ width: '100%' }} onClick={restart}>もう一度</button>}
      </div>
    )
  }

  const myChips = state.chips[playerId]
  const oppChips = state.chips[opponentId]

  function toggleTile(t) {
    setSelected((prev) => {
      if (prev.includes(t)) return prev.filter((x) => x !== t)
      if (prev.length >= 13) return prev
      return [...prev, t]
    })
  }

  async function confirmHand() {
    if (busy || selected.length !== 13 || !tenpaiInfo.tenpai) return
    setBusy(true)
    try {
      const hand = sortTiles(selected)
      const discardPool = sortTiles(ALL_TILES.filter((t) => !hand.includes(t)))
      await updateRoom(code, {
        [`juunanaho.hand.${playerId}`]: hand,
        [`juunanaho.discardPool.${playerId}`]: discardPool,
        [`juunanaho.ready.${playerId}`]: true,
      })
    } finally { setBusy(false) }
  }

  async function discardTile(t) {
    if (busy || state.phase !== 'discarding' || state.turnPlayerId !== playerId) return
    setBusy(true)
    try {
      const newDiscarded = [...state.discarded[playerId], t]
      const newPool = state.discardPool[playerId].filter((x) => x !== t)
      await updateRoom(code, {
        [`juunanaho.discarded.${playerId}`]: newDiscarded,
        [`juunanaho.discardPool.${playerId}`]: newPool,
        'juunanaho.pendingDiscard': { by: playerId, tile: t },
        'juunanaho.phase': 'ronCheck',
      })
    } finally { setBusy(false) }
  }

  async function declareRon() {
    if (busy || state.phase !== 'ronCheck' || state.pendingDiscard.by === playerId) return
    setBusy(true)
    try {
      const myHand = state.hand[playerId]
      if (!isComplete14([...myHand, state.pendingDiscard.tile])) return
      const chips = { ...state.chips, [playerId]: (state.chips[playerId] || 0) + state.pot }
      await updateRoom(code, {
        'juunanaho.chips': chips,
        'juunanaho.pot': 0,
        'juunanaho.phase': 'result',
        'juunanaho.result': { type: 'ron', winnerId: playerId, tile: state.pendingDiscard.tile },
      })
    } finally { setBusy(false) }
  }

  async function passRon() {
    if (busy || state.phase !== 'ronCheck' || state.pendingDiscard.by === playerId) return
    setBusy(true)
    try {
      const myHand = state.hand[playerId]
      const wasWait = isComplete14([...myHand, state.pendingDiscard.tile])
      const newTurnCount = state.turnCount + 1
      if (newTurnCount >= MAX_TURNS) {
        const idA = state.dealerId
        const idB = otherIdOf(state)
        const half = Math.floor(state.pot / 2)
        const chips = { ...state.chips, [idA]: state.chips[idA] + half, [idB]: state.chips[idB] + (state.pot - half) }
        await updateRoom(code, {
          'juunanaho.chips': chips,
          'juunanaho.pot': 0,
          'juunanaho.phase': 'result',
          'juunanaho.result': { type: 'draw' },
          ...(wasWait ? { [`juunanaho.furiten.${playerId}`]: true } : {}),
        })
        return
      }
      await updateRoom(code, {
        'juunanaho.turnCount': newTurnCount,
        'juunanaho.turnPlayerId': playerId,
        'juunanaho.phase': 'discarding',
        'juunanaho.pendingDiscard': null,
        ...(wasWait ? { [`juunanaho.furiten.${playerId}`]: true } : {}),
      })
    } finally { setBusy(false) }
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
        await updateRoom(code, { 'juunanaho.phase': 'gameover', 'juunanaho.winnerId': winnerId })
        await addScore(code, winnerId, 1)
        return
      }
      await updateRoom(code, {
        juunanaho: { ...startHand(idB, idA, state.chips), handIndex: state.handIndex + 1, winnerId: null },
      })
    } finally { setBusy(false) }
  }

  async function restart() {
    if (!isHost) return
    await updateRoom(code, { juunanaho: { ...startHand(first.id, second.id, { [first.id]: CHIPS_17HO, [second.id]: CHIPS_17HO }), handIndex: 0, winnerId: null } })
  }

  const myTurn = state.phase === 'discarding' && state.turnPlayerId === playerId
  const canReactToRon = state.phase === 'ronCheck' && state.pendingDiscard?.by !== playerId
  const canRonNow = canReactToRon && !state.furiten[playerId] && state.hand[playerId] && isComplete14([...state.hand[playerId], state.pendingDiscard.tile])

  return (
    <div className="card">
      <div className="eyebrow">17歩 ・ 第{state.handIndex + 1}局</div>
      <div className="title">
        {state.phase === 'selecting' && (state.ready[playerId] ? '相手の手作りを待っています…' : '13枚選んでテンパイを作ってください')}
        {state.phase === 'discarding' && (myTurn ? 'あなたの番です(1枚切ってください)' : `${opponent.name} の番です`)}
        {state.phase === 'ronCheck' && (canReactToRon ? 'ロンできますか？' : `${opponent.name} の判断を待っています…`)}
        {state.phase === 'result' && (
          state.result.type === 'draw'
            ? '17巡が終わり流局です'
            : state.result.winnerId === playerId ? 'ロン！あなたの勝ち！' : `ロン！${opponent.name} の勝ち`
        )}
      </div>

      <div style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
        <span className="chip-count">あなた: {myChips}</span>
        <span className="chip-count">{opponent.name}: {oppChips}</span>
        <span className="chip-count" style={{ color: 'var(--text-mid)' }}>POT: {state.pot}</span>
        {state.phase !== 'selecting' && <span style={{ fontSize: 12, color: 'var(--text-lo)' }}>{Math.floor(state.turnCount / 2) + 1}巡目 / 17巡</span>}
      </div>

      {state.phase === 'selecting' && !state.ready[playerId] && (
        <>
          <p className="subtitle">
            34種の牌から13枚を選び、あと1枚であがれる「テンパイ」の形を作ってください。
            {' '}選択中: {selected.length}/13 ・ {tenpaiInfo.tenpai ? <strong style={{ color: 'var(--success)' }}>テンパイです</strong> : <span style={{ color: 'var(--danger)' }}>まだテンパイではありません</span>}
          </p>
          {TILE_ROWS.map((row, i) => (
            <div key={i} style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 6 }}>
              {row.map((t) => (
                <button
                  key={t}
                  className={`mahjong-tile ${tileSuitClass(t)}${selected.includes(t) ? ' is-selected' : ''}`}
                  onClick={() => toggleTile(t)}
                >
                  {tileLabel(t)}
                </button>
              ))}
            </div>
          ))}
          <button className="btn btn-amber" style={{ width: '100%', marginTop: 12 }} disabled={busy || selected.length !== 13 || !tenpaiInfo.tenpai} onClick={confirmHand}>
            この手で決定
          </button>
        </>
      )}

      {state.phase !== 'selecting' && state.hand[playerId] && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 12, color: 'var(--text-lo)', marginBottom: 4 }}>あなたの手(テンパイ確定)</div>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {state.hand[playerId].map((t, i) => (
              <div key={i} className={`mahjong-tile ${tileSuitClass(t)}`} style={{ cursor: 'default' }}>{tileLabel(t)}</div>
            ))}
          </div>
          {state.furiten[playerId] && <p style={{ color: 'var(--danger)', fontSize: 12, marginTop: 4 }}>フリテン中(このハンドはロンできません)</p>}
        </div>
      )}

      {myTurn && (
        <>
          <p className="subtitle">捨て牌候補からロンされないよう1枚選んで切ってください。</p>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {state.discardPool[playerId].map((t) => (
              <button key={t} className={`mahjong-tile ${tileSuitClass(t)}`} disabled={busy} onClick={() => discardTile(t)}>
                {tileLabel(t)}
              </button>
            ))}
          </div>
        </>
      )}

      {state.phase === 'ronCheck' && (
        <div style={{ margin: '16px 0', textAlign: 'center' }}>
          <p className="subtitle">{state.pendingDiscard.by === playerId ? 'あなた' : opponent.name}の捨て牌:</p>
          <div className={`mahjong-tile ${tileSuitClass(state.pendingDiscard.tile)}`} style={{ margin: '0 auto', cursor: 'default', width: 48, height: 64, fontSize: 18 }}>
            {tileLabel(state.pendingDiscard.tile)}
          </div>
          {canReactToRon && (
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button className="btn btn-ghost" style={{ flex: 1 }} disabled={busy} onClick={passRon}>スルー</button>
              <button className="btn btn-amber" style={{ flex: 1 }} disabled={busy || !canRonNow} onClick={declareRon}>ロン！</button>
            </div>
          )}
        </div>
      )}

      {state.phase === 'result' && isHost && (
        <button className="btn btn-amber" style={{ width: '100%', marginTop: 12 }} disabled={busy} onClick={nextHand}>次のハンドへ</button>
      )}

      <p className="subtitle" style={{ marginTop: 16 }}>
        34種の牌から13枚を選んでテンパイ(あと1枚であがれる形)を作り、残り21枚を1枚ずつ切っていきます。
        相手の捨て牌が自分のあがり牌ならロンで勝ち、見逃すとそのハンドの間はロンできなくなります(フリテン)。
        17巡で決着しなければ流局(山分け)です。役の判定エンジンは省略し、4面子1雀頭が揃えばあがりとしています。
      </p>
    </div>
  )
}
