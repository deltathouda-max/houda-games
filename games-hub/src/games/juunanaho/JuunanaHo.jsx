import { useEffect, useMemo, useState } from 'react'
import { updateRoom, guardedUpdate, addScore } from '../../lib/room.js'
import useTwoPlayerTurns from '../boardShared/useTwoPlayerTurns.js'
import { standardDeck, shuffle, sortTiles, tileLabel, tileSuitClass, ANTE_17HO, MAX_TURNS } from './juunanahoLogic.js'
import { evaluateWin, tenpaiHasManganWait, nextDoraTile, randomDoraIndicator } from './mahjongScore.js'

const CHIPS_17HO = 1000

function startHand(dealerId, otherId, chips) {
  const ante = { [dealerId]: Math.min(ANTE_17HO, chips[dealerId]), [otherId]: Math.min(ANTE_17HO, chips[otherId]) }
  const nextChips = { [dealerId]: chips[dealerId] - ante[dealerId], [otherId]: chips[otherId] - ante[otherId] }
  const doraIndicator = randomDoraIndicator()
  // 136枚の山をシャッフルし、両者にそれぞれ34枚配る(通常の麻雀と同じく各牌種4枚まで存在するため重複あり)
  const deck = shuffle(standardDeck())
  const wallA = sortTiles(deck.slice(0, 34))
  const wallB = sortTiles(deck.slice(34, 68))
  return {
    dealerId,
    chips: nextChips,
    pot: ante[dealerId] + ante[otherId],
    phase: 'selecting',
    doraIndicator,
    doraTile: nextDoraTile(doraIndicator),
    wall: { [dealerId]: wallA, [otherId]: wallB },
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

export default function JuunanaHo({ code, playerId, room, players, isHost }) {
  const state = room.juunanaho
  const { first, second, myRole } = useTwoPlayerTurns(players, playerId)
  const [selectedIdx, setSelectedIdx] = useState([])
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

  useEffect(() => { setSelectedIdx([]) }, [state?.handIndex])

  const myWall = state?.wall?.[playerId]
  const selectedTiles = useMemo(() => (myWall ? selectedIdx.map((i) => myWall[i]) : []), [myWall, selectedIdx])

  const tenpaiInfo = useMemo(() => {
    if (selectedTiles.length !== 13) return { tenpai: false, manganOk: false, waits: [], manganWaits: [] }
    const sorted = sortTiles(selectedTiles)
    const { ok, waits, manganWaits } = tenpaiHasManganWait(sorted, state?.doraTile)
    return { tenpai: waits.length > 0, manganOk: ok, waits, manganWaits: manganWaits ?? [] }
  }, [selectedTiles, state?.doraTile])

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

  function toggleSlot(idx) {
    setSelectedIdx((prev) => {
      if (prev.includes(idx)) return prev.filter((x) => x !== idx)
      if (prev.length >= 13) return prev
      return [...prev, idx]
    })
  }

  async function confirmHand() {
    if (busy || selectedTiles.length !== 13 || !tenpaiInfo.manganOk) return
    setBusy(true)
    try {
      const hand = sortTiles(selectedTiles)
      const restIdx = myWall.map((_, i) => i).filter((i) => !selectedIdx.includes(i))
      const discardPool = sortTiles(restIdx.map((i) => myWall[i]))
      await updateRoom(code, {
        [`juunanaho.hand.${playerId}`]: hand,
        [`juunanaho.discardPool.${playerId}`]: discardPool,
        [`juunanaho.ready.${playerId}`]: true,
      })
    } finally { setBusy(false) }
  }

  // 同じ牌種が複数枚あり得るため、指定した牌を「1枚だけ」取り除く
  function removeOne(arr, t) {
    const idx = arr.indexOf(t)
    if (idx < 0) return arr
    return [...arr.slice(0, idx), ...arr.slice(idx + 1)]
  }

  async function discardTile(t) {
    if (busy || state.phase !== 'discarding' || state.turnPlayerId !== playerId) return
    setBusy(true)
    try {
      const newDiscarded = [...state.discarded[playerId], t]
      const newPool = removeOne(state.discardPool[playerId], t)
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
      const result = evaluateWin(myHand, state.pendingDiscard.tile, state.doraTile)
      if (!result.manganOrAbove) return
      const chips = { ...state.chips, [playerId]: (state.chips[playerId] || 0) + state.pot }
      await updateRoom(code, {
        'juunanaho.chips': chips,
        'juunanaho.pot': 0,
        'juunanaho.phase': 'result',
        'juunanaho.result': { type: 'ron', winnerId: playerId, tile: state.pendingDiscard.tile, yaku: result.yaku, han: result.totalHan, dora: result.dora },
      })
    } finally { setBusy(false) }
  }

  async function passRon() {
    if (busy || state.phase !== 'ronCheck' || state.pendingDiscard.by === playerId) return
    setBusy(true)
    try {
      const myHand = state.hand[playerId]
      const wasWait = evaluateWin(myHand, state.pendingDiscard.tile, state.doraTile).manganOrAbove
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
  const pendingEval = canReactToRon && state.hand[playerId] ? evaluateWin(state.hand[playerId], state.pendingDiscard.tile, state.doraTile) : null
  const canRonNow = canReactToRon && !state.furiten[playerId] && pendingEval?.manganOrAbove

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

      <div style={{ display: 'flex', gap: 16, marginBottom: 12, flexWrap: 'wrap' }}>
        <span className="chip-count">あなた: {myChips}</span>
        <span className="chip-count">{opponent.name}: {oppChips}</span>
        <span className="chip-count" style={{ color: 'var(--text-mid)' }}>POT: {state.pot}</span>
        {state.phase !== 'selecting' && <span style={{ fontSize: 12, color: 'var(--text-lo)' }}>{Math.floor(state.turnCount / 2) + 1}巡目 / 17巡</span>}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <span style={{ fontSize: 12, color: 'var(--text-lo)' }}>ドラ表示牌</span>
        <div className={`mahjong-tile ${tileSuitClass(state.doraIndicator)}`} style={{ cursor: 'default', width: 32, height: 44, fontSize: 13 }}>{tileLabel(state.doraIndicator)}</div>
        <span style={{ fontSize: 12, color: 'var(--text-lo)' }}>→ドラ:</span>
        <div className={`mahjong-tile ${tileSuitClass(state.doraTile)}`} style={{ cursor: 'default', width: 32, height: 44, fontSize: 13, borderColor: 'var(--amber-400)' }}>{tileLabel(state.doraTile)}</div>
      </div>

      {state.phase === 'selecting' && !state.ready[playerId] && myWall && (
        <>
          <p className="subtitle">
            配られた34枚の中から13枚を選び、あと1枚であがれば「満貫以上」になるテンパイの形を作ってください
            (役なしではあがれません。ドラは翻数に加算されます)。
            {' '}選択中: {selectedTiles.length}/13{selectedTiles.length === 13 && (
              !tenpaiInfo.tenpai
                ? <span style={{ color: 'var(--danger)' }}> ・ まだテンパイではありません</span>
                : tenpaiInfo.manganOk
                  ? <strong style={{ color: 'var(--success)' }}> ・ 満貫以上の待ちがあります({tenpaiInfo.manganWaits.map(tileLabel).join('・')})</strong>
                  : <span style={{ color: 'var(--danger)' }}> ・ テンパイですが満貫未満です(役が足りません)</span>
            )}
          </p>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 6 }}>
            {myWall.map((t, i) => (
              <button
                key={i}
                className={`mahjong-tile ${tileSuitClass(t)}${selectedIdx.includes(i) ? ' is-selected' : ''}`}
                onClick={() => toggleSlot(i)}
              >
                {tileLabel(t)}
              </button>
            ))}
          </div>
          <button className="btn btn-amber" style={{ width: '100%', marginTop: 12 }} disabled={busy || selectedTiles.length !== 13 || !tenpaiInfo.manganOk} onClick={confirmHand}>
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
            {state.discardPool[playerId].map((t, i) => (
              <button key={i} className={`mahjong-tile ${tileSuitClass(t)}`} disabled={busy} onClick={() => discardTile(t)}>
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
            <>
              {pendingEval?.valid && !pendingEval.manganOrAbove && !state.furiten[playerId] && (
                <p style={{ color: 'var(--text-lo)', fontSize: 12, marginTop: 4 }}>
                  あがれる形ですが役が足りず満貫未満のためロンできません
                  {pendingEval.yaku.length > 0 && `(${pendingEval.yaku.map((y) => `${y.name}${y.han}翻`).join('・')})`}
                </p>
              )}
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <button className="btn btn-ghost" style={{ flex: 1 }} disabled={busy} onClick={passRon}>スルー</button>
                <button className="btn btn-amber" style={{ flex: 1 }} disabled={busy || !canRonNow} onClick={declareRon}>ロン！</button>
              </div>
            </>
          )}
        </div>
      )}

      {state.phase === 'result' && state.result.type === 'ron' && (
        <p className="subtitle" style={{ textAlign: 'center' }}>
          役: {state.result.yaku?.map((y) => `${y.name}(${y.han}翻)`).join('・')}
          {state.result.dora > 0 && ` ・ ドラ${state.result.dora}翻`}
          {' '}・ 計{state.result.han}翻
        </p>
      )}

      {state.phase === 'result' && isHost && (
        <button className="btn btn-amber" style={{ width: '100%', marginTop: 12 }} disabled={busy} onClick={nextHand}>次のハンドへ</button>
      )}

      <p className="subtitle" style={{ marginTop: 16 }}>
        シャッフルした牌山から34枚配られるので、その中から13枚を選んでテンパイ(あと1枚であがれる形)を作り、
        残り21枚を1枚ずつ切っていきます(通常の麻雀と同じく同じ牌は最大4枚まで持てます)。
        相手の捨て牌が自分のあがり牌で、かつ満貫以上ならロンで勝ちです。
        満貫未満の場合や見逃した場合、そのハンドの間はロンできなくなります(フリテン)。
        17巡で決着しなければ流局(山分け)です。
      </p>
    </div>
  )
}
