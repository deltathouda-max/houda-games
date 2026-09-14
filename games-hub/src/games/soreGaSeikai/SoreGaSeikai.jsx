import { useEffect, useMemo, useRef, useState } from 'react'
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

  useEffect(() => {
    if (!isHost || !round || round.phase !== 'answering') return
    if ((allAnswered || timeUp) && !revealedRef.current) {
      revealedRef.current = true
      updateRoom(code, { 'round.phase': 'reveal' })
    }
  }, [isHost, round?.phase, allAnswered, timeUp, code])

  const myAnswer = round?.answers?.[playerId] ?? ''

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
        winnerId: null,
      },
    })
  }

  async function submitAnswer() {
    if (!answerText.trim()) return
    await updateRoom(code, { [`round.answers.${playerId}`]: answerText.trim() })
  }

  async function pickWinner(winnerId) {
    await updateRoom(code, { 'round.phase': 'judged', 'round.winnerId': winnerId })
    await addScore(code, winnerId, 1)
  }

  const answerList = useMemo(() => {
    if (!round) return []
    return players.map((p) => ({ player: p, text: round.answers?.[p.id] ?? null }))
  }, [round, players])

  const remainingSeconds = round?.deadlineAt ? Math.max(0, Math.ceil((round.deadlineAt - now) / 1000)) : null

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

      {(round.phase === 'reveal' || round.phase === 'judged') && (
        <>
          <p className="subtitle">
            {round.phase === 'reveal'
              ? isHost ? '話し合って、正解だと思う回答をタップしてください' : 'ホストが選ぶのを待っています…'
              : '正解が選ばれました！'}
          </p>
          {answerList.map(({ player, text }) => (
            <div
              key={player.id}
              className={`answer-row${round.winnerId === player.id ? ' winner' : ''}`}
              onClick={() => isHost && round.phase === 'reveal' && text && pickWinner(player.id)}
              style={{ cursor: isHost && round.phase === 'reveal' ? 'pointer' : 'default' }}
            >
              <strong>{player.name}</strong>: {text ?? '(未回答)'}
              {round.winnerId === player.id && ' 🏆'}
            </div>
          ))}
          {isHost && round.phase === 'judged' && (
            <button className="btn btn-amber" style={{ marginTop: 12 }} onClick={startRound}>次のお題へ</button>
          )}
        </>
      )}
    </div>
  )
}
