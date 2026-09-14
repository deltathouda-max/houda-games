import { useEffect, useState } from 'react'
import { updateRoom, guardedUpdate, backToLobby } from '../../lib/room.js'
import { getRandomWord } from './wordSource.js'

export default function WordDrop({ code, playerId, room, players, isHost }) {
  const state = room.wordDrop
  const [answerText, setAnswerText] = useState('')
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    if (isHost && !state && players.length >= 2) {
      updateRoom(code, {
        wordDrop: { phase: 'oyaSelect', oyaId: null, topic: null, deadlineAt: null, answers: {}, roundIndex: 0 },
      })
    }
  }, [isHost, state, players.length, code])

  useEffect(() => {
    if (!state?.deadlineAt) return
    const t = setInterval(() => setNow(Date.now()), 500)
    return () => clearInterval(t)
  }, [state?.deadlineAt])

  const remainingSeconds = state?.deadlineAt ? Math.max(0, Math.ceil((state.deadlineAt - now) / 1000)) : null
  const timeUp = Boolean(state?.deadlineAt) && now >= state.deadlineAt

  // talking / thinking の時間切れを自動で次のフェーズへ進める(ホストの画面だけが監視する)
  useEffect(() => {
    if (!isHost || !state || !timeUp) return
    if (state.phase === 'talking') {
      updateRoom(code, { 'wordDrop.phase': 'thinking', 'wordDrop.deadlineAt': Date.now() + 60 * 1000, 'wordDrop.answers': {} })
    } else if (state.phase === 'thinking') {
      updateRoom(code, { 'wordDrop.phase': 'answerReveal', 'wordDrop.deadlineAt': null })
    }
  }, [isHost, state?.phase, timeUp, code])

  if (!state) {
    return (
      <div className="card">
        <div className="eyebrow">ワード落とし</div>
        <div className="title">準備中…</div>
        <p className="subtitle">2人揃うと自動で始まります。</p>
      </div>
    )
  }

  const nameOf = (pid) => players.find((p) => p.id === pid)?.name ?? '?'
  const isOya = state.oyaId === playerId
  const talkSeconds = room.settings?.talkSeconds ?? 60

  async function selectOya(pid) {
    if (!isHost || state.phase !== 'oyaSelect') return
    await updateRoom(code, {
      'wordDrop.oyaId': pid,
      'wordDrop.topic': getRandomWord(),
      'wordDrop.phase': 'ready',
    })
  }

  async function startTalking() {
    if (!isOya || state.phase !== 'ready') return
    await updateRoom(code, { 'wordDrop.phase': 'talking', 'wordDrop.deadlineAt': Date.now() + talkSeconds * 1000 })
  }

  async function submitAnswer() {
    if (!answerText.trim() || isOya) return
    await updateRoom(code, { [`wordDrop.answers.${playerId}`]: answerText.trim() })
    setAnswerText('')
  }

  async function goToTopicReveal() {
    await guardedUpdate(code, (r) => r.wordDrop?.phase === 'answerReveal', { 'wordDrop.phase': 'topicReveal' })
  }

  async function nextRound() {
    await guardedUpdate(code, (r) => r.wordDrop?.phase === 'topicReveal', {
      'wordDrop.phase': 'oyaSelect',
      'wordDrop.oyaId': null,
      'wordDrop.topic': null,
      'wordDrop.deadlineAt': null,
      'wordDrop.answers': {},
      'wordDrop.roundIndex': (state.roundIndex ?? 0) + 1,
    })
  }

  async function endGame() {
    if (!isHost) return
    if (!window.confirm('ゲームを終了しますか？')) return
    await backToLobby(code)
  }

  const kodomoList = players.filter((p) => p.id !== state.oyaId)
  const myAnswered = Boolean(state.answers?.[playerId])

  return (
    <div className="card">
      <div className="eyebrow">ワード落とし {state.roundIndex > 0 ? `第${state.roundIndex + 1}ラウンド` : ''}</div>

      {state.phase === 'oyaSelect' && (
        <>
          <div className="title">親を選んでください</div>
          {isHost ? (
            <>
              <p className="subtitle">ホスト自身を選んでもOKです。</p>
              {players.map((p) => (
                <div key={p.id} className="player-row" style={{ cursor: 'pointer' }} onClick={() => selectOya(p.id)}>
                  <span>{p.name}</span>
                  <button className="btn btn-ghost" style={{ padding: '4px 12px' }}>親にする</button>
                </div>
              ))}
            </>
          ) : (
            <p className="subtitle">ホストが親を選んでいます…</p>
          )}
        </>
      )}

      {state.phase === 'ready' && (
        isOya ? (
          <>
            <div className="title">お題: {state.topic}</div>
            <p className="subtitle">このお題を、制限時間内にさりげなく会話に混ぜて発言してください。準備ができたら開始しましょう。</p>
            <button className="btn btn-amber" style={{ width: '100%' }} onClick={startTalking}>ゲーム開始</button>
          </>
        ) : (
          <>
            <div className="title">{nameOf(state.oyaId)} さんが親です</div>
            <p className="subtitle">親がお題を確認しています。まもなく始まります…</p>
          </>
        )
      )}

      {state.phase === 'talking' && (
        <>
          <div className="title">残り {remainingSeconds} 秒</div>
          {isOya ? (
            <p className="subtitle">お題: <strong>{state.topic}</strong>(このお題をさりげなく会話に混ぜてください)</p>
          ) : (
            <p className="subtitle">あなたは子です。会話をよく聞いて、お題を推理してください。</p>
          )}
        </>
      )}

      {state.phase === 'thinking' && (
        <>
          <div className="title">シンキングタイム 残り {remainingSeconds} 秒</div>
          {isOya ? (
            <p className="subtitle">子がお題を考えています…</p>
          ) : myAnswered ? (
            <p style={{ color: 'var(--success)' }}>回答済み。全員の回答を待っています</p>
          ) : (
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                className="input"
                value={answerText}
                onChange={(e) => setAnswerText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && submitAnswer()}
                placeholder="お題を予想して入力"
                maxLength={40}
                autoFocus
              />
              <button className="btn btn-amber" onClick={submitAnswer}>決定</button>
            </div>
          )}
        </>
      )}

      {(state.phase === 'answerReveal' || state.phase === 'topicReveal') && (
        <>
          <div className="title">
            {state.phase === 'topicReveal' ? `お題は「${state.topic}」でした` : '回答一覧'}
          </div>
          {kodomoList.map((p) => (
            <div key={p.id} className="answer-row">
              <strong>{p.name}</strong>: {state.answers?.[p.id] ?? '(未回答)'}
            </div>
          ))}
          {state.phase === 'answerReveal' && (
            <button className="btn btn-amber" style={{ width: '100%', marginTop: 12 }} onClick={goToTopicReveal}>次へ</button>
          )}
          {state.phase === 'topicReveal' && (
            <button className="btn btn-amber" style={{ width: '100%', marginTop: 12 }} onClick={nextRound}>次のラウンドへ</button>
          )}
        </>
      )}

      {isHost && (
        <button className="btn btn-ghost" style={{ width: '100%', marginTop: 16 }} onClick={endGame}>ゲーム終了</button>
      )}
    </div>
  )
}
