import { useEffect, useRef, useState } from 'react'
import { updateRoom, addScore } from '../../lib/room.js'
import { drawTopic } from './topics.js'
import Typewriter from '../../components/Typewriter.jsx'

export default function SoreGaSeikai({ code, playerId, room, players, isHost }) {
  const round = room.round
  const [answerText, setAnswerText] = useState('')
  const [now, setNow] = useState(Date.now())
  const revealedRef = useRef(false)

  useEffect(() => {
    if (!round || round.phase !== 'answering' || !round.deadlineAt) return
    const t = setInterval(() => setNow(Date.now()), 500)
    return () => clearInterval(t)
  }, [round?.phase, round?.deadlineAt])

  useEffect(() => { revealedRef.current = false }, [round?.index])

  const answeredCount = round ? Object.keys(round.answers || {}).length : 0
  const allAnswered = round ? answeredCount >= players.length : false
  const timeUp = Boolean(round?.deadlineAt) && now >= round.deadlineAt

  // 全員回答済みか時間切れになったら、発表フェーズ(まずホストが発表順を決める)へ進める
  useEffect(() => {
    if (!isHost || !round || round.phase !== 'answering') return
    if ((allAnswered || timeUp) && !revealedRef.current) {
      revealedRef.current = true
      updateRoom(code, { 'round.phase': 'ordering', 'round.order': [] })
    }
  }, [isHost, round?.phase, allAnswered, timeUp, code])

  const myAnswer = round?.answers?.[playerId] ?? ''
  const order = round?.order ?? []
  const revealedCount = round?.revealedCount ?? 0
  const allPresented = revealedCount >= order.length

  async function startRound() {
    const topic = drawTopic()
    const timerSeconds = room.settings?.timerSeconds || 0
    await updateRoom(code, {
      round: {
        index: (round?.index ?? -1) + 1,
        topic,
        phase: 'answering',
        deadlineAt: timerSeconds > 0 ? Date.now() + timerSeconds * 1000 : null,
        answers: {},
        order: [],
        revealedCount: 0,
        currentRevealed: false,
        winnerId: null,
      },
    })
  }

  async function submitAnswer() {
    if (!answerText.trim()) return
    await updateRoom(code, { [`round.answers.${playerId}`]: answerText.trim() })
  }

  async function addToOrder(pid) {
    const newOrder = [...order, pid]
    const patch = { 'round.order': newOrder }
    if (newOrder.length >= players.length) {
      patch['round.phase'] = 'presenting'
      patch['round.revealedCount'] = 0
      patch['round.currentRevealed'] = false
    }
    await updateRoom(code, patch)
  }

  async function resetOrder() {
    await updateRoom(code, { 'round.order': [] })
  }

  async function revealCurrent() {
    await updateRoom(code, { 'round.currentRevealed': true })
  }

  async function nextPresenter() {
    await updateRoom(code, { 'round.revealedCount': revealedCount + 1, 'round.currentRevealed': false })
  }

  async function pickWinner(winnerId) {
    await updateRoom(code, { 'round.phase': 'judged', 'round.winnerId': winnerId })
    await addScore(code, winnerId, 1)
  }

  const remainingSeconds = round?.deadlineAt ? Math.max(0, Math.ceil((round.deadlineAt - now) / 1000)) : null
  const presentationOrder = order.length ? order : players.map((p) => p.id)

  if (!round) {
    return (
      <div className="card">
        <div className="eyebrow">激論！朝までそれ正解！</div>
        <div className="title">最初のお題を出しましょう</div>
        <p className="subtitle">全員揃ったらホストがお題を引きます。</p>
        {isHost ? (
          <button className="btn btn-amber" onClick={startRound}>お題を引く</button>
        ) : (
          <p style={{ color: 'var(--text-mid)' }}>ホストがお題を出すのを待っています…</p>
        )}
      </div>
    )
  }

  return (
    <div className="card">
      <div className="eyebrow">第{round.index + 1}問</div>
      <div className="title"><Typewriter text={round.topic.text} /></div>

      {round.phase === 'answering' && (
        <>
          <p className="subtitle">
            {remainingSeconds !== null ? `残り${remainingSeconds}秒 ・ ` : ''}
            回答済み {answeredCount} / {players.length}人
          </p>
          {myAnswer ? (
            <p style={{ color: 'var(--success)' }}>回答済み: 「{myAnswer}」他の人の回答を待っています…</p>
          ) : (
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                className="input"
                value={answerText}
                onChange={(e) => setAnswerText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && submitAnswer()}
                placeholder="回答を入力"
                maxLength={40}
                autoFocus
              />
              <button className="btn btn-amber" onClick={submitAnswer}>決定</button>
            </div>
          )}
        </>
      )}

      {round.phase === 'ordering' && (
        <>
          <p className="subtitle">
            {isHost ? '発表する順番を選んでください(タップした順に発表されます)' : 'ホストが発表順を決めています…'}
          </p>
          {isHost && (
            <>
              {order.length > 0 && (
                <ol style={{ paddingLeft: 20, marginBottom: 12, color: 'var(--text-hi)' }}>
                  {order.map((pid) => (
                    <li key={pid}>{players.find((p) => p.id === pid)?.name ?? '?'}</li>
                  ))}
                </ol>
              )}
              <div className="game-list">
                {players.filter((p) => !order.includes(p.id)).map((p) => (
                  <button key={p.id} className="game-item" onClick={() => addToOrder(p.id)}>
                    <div className="game-item-name">{p.name}</div>
                  </button>
                ))}
              </div>
              {order.length > 0 && (
                <button className="btn btn-ghost" style={{ marginTop: 12, width: '100%' }} onClick={resetOrder}>
                  やり直す
                </button>
              )}
            </>
          )}
        </>
      )}

      {round.phase === 'presenting' && !allPresented && (() => {
        const presenterId = order[revealedCount]
        const presenter = players.find((p) => p.id === presenterId)
        const isMyTurn = playerId === presenterId
        return (
          <>
            <p className="subtitle">{presenter?.name ?? '?'} さんの発表({revealedCount + 1} / {order.length}人目)</p>
            {order.slice(0, revealedCount).map((pid) => {
              const p = players.find((pp) => pp.id === pid)
              return (
                <div key={pid} className="answer-row">
                  <strong>{p?.name}</strong>: {round.answers?.[pid] ?? '(未回答)'}
                </div>
              )
            })}
            {round.currentRevealed ? (
              <div className="answer-row" style={{ borderColor: 'var(--amber-400)' }}>
                <strong>{presenter?.name}</strong>: {round.answers?.[presenterId] ?? '(未回答)'}
              </div>
            ) : (
              <div className="answer-row" style={{ color: 'var(--text-lo)' }}>？？？ まだ発表されていません</div>
            )}
            {isMyTurn && (
              round.currentRevealed ? (
                <button className="btn btn-amber" style={{ marginTop: 12, width: '100%' }} onClick={nextPresenter}>
                  次へ
                </button>
              ) : (
                <button className="btn btn-amber" style={{ marginTop: 12, width: '100%' }} onClick={revealCurrent}>
                  発表する
                </button>
              )
            )}
            {!isMyTurn && (
              <p style={{ color: 'var(--text-mid)', marginTop: 12 }}>
                {round.currentRevealed ? `${presenter?.name}さんが次へ進むのを待っています…` : `${presenter?.name}さんの発表を待っています…`}
              </p>
            )}
          </>
        )
      })()}

      {((round.phase === 'presenting' && allPresented) || round.phase === 'judged') && (
        <>
          <p className="subtitle">
            {round.phase === 'judged'
              ? '正解が選ばれました!'
              : isHost ? '話し合って、正解だと思う回答をタップしてください' : 'ホストが選ぶのを待っています…'}
          </p>
          {presentationOrder.map((pid) => {
            const player = players.find((p) => p.id === pid)
            if (!player) return null
            const text = round.answers?.[pid] ?? null
            return (
              <div
                key={pid}
                className={`answer-row${round.winnerId === pid ? ' winner' : ''}`}
                onClick={() => isHost && round.phase === 'presenting' && text && pickWinner(pid)}
                style={{ cursor: isHost && round.phase === 'presenting' ? 'pointer' : 'default' }}
              >
                <strong>{player.name}</strong>: {text ?? '(未回答)'}
                {round.winnerId === pid && ' 🏆'}
              </div>
            )
          })}
          {isHost && round.phase === 'judged' && (
            <button className="btn btn-amber" style={{ marginTop: 12 }} onClick={startRound}>次のお題へ</button>
          )}
        </>
      )}
    </div>
  )
}
