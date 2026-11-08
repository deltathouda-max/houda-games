import { useEffect, useRef, useState } from 'react'
import { updateRoom, guardedUpdate, addScore } from '../../lib/room.js'
import { TOPICS, drawTopicIndex } from './topics.js'
import { judge, isValidPick, totalsFromLog, LABELS, POINTS } from './sanrentanLogic.js'

const OPTION_MARKS = ['A', 'B', 'C', 'D', 'E', 'F', 'G']

// 7つの選択肢から、タップした順に1〜3位を決める入力部品
function PickRanking({ options, submitLabel, onSubmit }) {
  const [pick, setPick] = useState([])
  const toggle = (i) => {
    setPick((cur) => (cur.includes(i) ? cur.filter((x) => x !== i) : cur.length < 3 ? [...cur, i] : cur))
  }
  return (
    <>
      <div className="game-list">
        {options.map((opt, i) => {
          const rank = pick.indexOf(i)
          return (
            <button key={i} className="game-item" onClick={() => toggle(i)} style={rank >= 0 ? { borderColor: 'var(--amber-400)' } : undefined}>
              <div className="game-item-name">
                <strong style={{ marginRight: 8 }}>{OPTION_MARKS[i]}</strong>{opt}
                {rank >= 0 && <span className="badge" style={{ marginLeft: 8 }}>{rank + 1}位</span>}
              </div>
            </button>
          )
        })}
      </div>
      <p className="subtitle" style={{ marginTop: 8 }}>タップした順に1位・2位・3位になります(もう一度タップで取り消し)</p>
      <button className="btn btn-amber" style={{ width: '100%', marginTop: 8 }} disabled={!isValidPick(pick)} onClick={() => onSubmit(pick)}>
        {submitLabel}
      </button>
    </>
  )
}

function RankLine({ options, pick }) {
  return (
    <span>
      {pick.map((i, r) => (
        <span key={r} style={{ marginRight: 10 }}>{r + 1}位 {OPTION_MARKS[i]}:{options[i]}</span>
      ))}
    </span>
  )
}

export default function Sanrentan({ code, playerId, room, players, isHost }) {
  const state = room.sanrentan
  const scoredRef = useRef(null)

  // ホストが最初の1回だけゲーム状態を作る(全員が一度ずつ出題者になる)
  useEffect(() => {
    if (isHost && !state && players.length >= 1) {
      const topicIdx = drawTopicIndex([])
      updateRoom(code, {
        sanrentan: {
          order: players.map((p) => p.id),
          idx: 0,
          topicIdx,
          used: [topicIdx],
          phase: 'ranking',
          answer: null,
          guesses: {},
          scored: {},
          log: {},
        },
      })
    }
  }, [isHost, state, players, code])

  const presentIds = new Set(players.map((p) => p.id))
  const parentId = state?.order?.[state.idx]
  const guesserIds = state ? state.order.filter((id) => id !== parentId && presentIds.has(id)) : []
  const allGuessed = guesserIds.length > 0 && guesserIds.every((id) => state?.guesses?.[id])

  // 全員の予想が揃ったら公開フェーズへ(ホストが1回だけ進め、その回の記録も残す)
  useEffect(() => {
    if (!isHost || !state || state.phase !== 'guessing' || !allGuessed) return
    const idx = state.idx
    guardedUpdate(code, (d) => d.sanrentan?.phase === 'guessing' && d.sanrentan?.idx === idx, {
      'sanrentan.phase': 'reveal',
      [`sanrentan.log.${idx}`]: {
        parentId: state.order[idx],
        topicIdx: state.topicIdx,
        answer: state.answer,
        guesses: state.guesses,
      },
    })
  }, [isHost, state, allGuessed, code])

  // 公開された回の得点は、各自が自分の分を1回だけルームのスコアに加算する
  useEffect(() => {
    if (!state || state.phase !== 'reveal') return
    const myGuess = state.guesses?.[playerId]
    if (!myGuess || playerId === parentId) return
    const key = `${state.idx}`
    if (state.scored?.[key]?.[playerId] || scoredRef.current === key) return
    scoredRef.current = key
    const { points } = judge(state.answer, myGuess)
    updateRoom(code, { [`sanrentan.scored.${key}.${playerId}`]: true })
      .then(() => (points > 0 ? addScore(code, playerId, points) : null))
      .catch(() => { scoredRef.current = null })
  }, [state, playerId, parentId, code])

  if (!state) {
    return (
      <div className="card">
        <div className="eyebrow">サンレンタン</div>
        <div className="title">準備中…</div>
        <p className="subtitle">準備を始めています…</p>
      </div>
    )
  }

  const nameOf = (pid) => players.find((p) => p.id === pid)?.name ?? '?'
  const topic = TOPICS[state.topicIdx]
  const isParent = playerId === parentId
  const parentPresent = presentIds.has(parentId)
  const roundNo = state.idx + 1
  const totalRounds = state.order.length

  async function submitAnswer(pick) {
    await updateRoom(code, { 'sanrentan.answer': pick, 'sanrentan.phase': 'guessing' })
  }

  async function submitGuess(pick) {
    await updateRoom(code, { [`sanrentan.guesses.${playerId}`]: pick })
  }

  async function nextRound() {
    const idx = state.idx
    if (idx + 1 >= state.order.length) {
      await guardedUpdate(code, (d) => d.sanrentan?.idx === idx && d.sanrentan?.phase !== 'finished', { 'sanrentan.phase': 'finished' })
      return
    }
    const topicIdx = drawTopicIndex(state.used || [])
    await guardedUpdate(code, (d) => d.sanrentan?.idx === idx && d.sanrentan?.phase !== 'finished', {
      'sanrentan.idx': idx + 1,
      'sanrentan.topicIdx': topicIdx,
      'sanrentan.used': [...(state.used || []), topicIdx],
      'sanrentan.phase': 'ranking',
      'sanrentan.answer': null,
      'sanrentan.guesses': {},
    })
  }

  async function restart() {
    await updateRoom(code, { sanrentan: null })
  }

  if (state.phase === 'finished') {
    const totals = totalsFromLog(state.log)
    const ranking = state.order
      .map((id) => ({ id, points: totals[id] || 0 }))
      .sort((a, b) => b.points - a.points)
    const top = ranking[0]?.points ?? 0
    return (
      <div className="card">
        <div className="eyebrow">サンレンタン</div>
        <div className="title">全員の出題が終わりました</div>
        {ranking.map((r) => (
          <div key={r.id} className={`answer-row${r.points === top && top > 0 ? ' winner' : ''}`} style={{ cursor: 'default' }}>
            <strong>{nameOf(r.id)}</strong>: {r.points}点{r.points === top && top > 0 && ' 🏆'}
          </div>
        ))}
        {isHost && <button className="btn btn-amber" style={{ width: '100%', marginTop: 12 }} onClick={restart}>最初から遊ぶ</button>}
      </div>
    )
  }

  return (
    <div className="card">
      <div className="eyebrow">第{roundNo} / {totalRounds}回 ・ 出題者: {nameOf(parentId)}</div>
      <div className="title">{topic.title}</div>

      {state.phase === 'ranking' && (
        isParent ? (
          <>
            <p className="subtitle">あなたの好きな順に、上位3つを選んでください(他の人には見えません)</p>
            <PickRanking options={topic.options} submitLabel="この順位で決定" onSubmit={submitAnswer} />
          </>
        ) : (
          <>
            <div className="game-list">
              {topic.options.map((opt, i) => (
                <div key={i} className="answer-row" style={{ cursor: 'default' }}><strong style={{ marginRight: 8 }}>{OPTION_MARKS[i]}</strong>{opt}</div>
              ))}
            </div>
            <p style={{ color: 'var(--text-mid)' }}>{nameOf(parentId)}さんが順位を決めています…</p>
            {!parentPresent && isHost && (
              <button className="btn btn-ghost" style={{ width: '100%', marginTop: 8 }} onClick={nextRound}>出題者が不在なのでスキップ</button>
            )}
          </>
        )
      )}

      {state.phase === 'guessing' && (
        isParent ? (
          <>
            {guesserIds.length === 0 && <p className="subtitle">予想するプレイヤーがいません(2人以上で遊べます)</p>}
            <p className="subtitle">みんなが予想中です… 予想済み {Object.keys(state.guesses || {}).filter((id) => id !== parentId).length} / {guesserIds.length}人</p>
            <div className="answer-row" style={{ cursor: 'default' }}>あなたの順位: <RankLine options={topic.options} pick={state.answer} /></div>
          </>
        ) : state.guesses?.[playerId] ? (
          <>
            <p style={{ color: 'var(--success)' }}>予想を送りました。他の人を待っています… ({Object.keys(state.guesses).length} / {guesserIds.length}人)</p>
            <div className="answer-row" style={{ cursor: 'default' }}>あなたの予想: <RankLine options={topic.options} pick={state.guesses[playerId]} /></div>
          </>
        ) : (
          <>
            <p className="subtitle">{nameOf(parentId)}さんの1〜3位を予想してください</p>
            <PickRanking options={topic.options} submitLabel="この予想で決定" onSubmit={submitGuess} />
          </>
        )
      )}

      {state.phase === 'reveal' && (
        <>
          <div className="answer-row winner" style={{ cursor: 'default' }}>
            <strong>{nameOf(parentId)}さんの順位</strong><br />
            <RankLine options={topic.options} pick={state.answer} />
          </div>
          {guesserIds.concat(Object.keys(state.guesses || {}).filter((id) => !guesserIds.includes(id) && id !== parentId)).map((pid) => {
            const g = state.guesses?.[pid]
            if (!g) return null
            const res = judge(state.answer, g)
            return (
              <div key={pid} className="answer-row" style={{ cursor: 'default' }}>
                <strong>{nameOf(pid)}</strong>: <RankLine options={topic.options} pick={g} /><br />
                <span style={{ color: res.points > 0 ? 'var(--amber-400)' : 'var(--text-lo)' }}>
                  {LABELS[res.kind]} +{res.points}点
                </span>
              </div>
            )
          })}
          {isHost ? (
            <button className="btn btn-amber" style={{ width: '100%', marginTop: 12 }} onClick={nextRound}>
              {state.idx + 1 >= state.order.length ? '結果発表へ' : '次の出題者へ'}
            </button>
          ) : (
            <p style={{ color: 'var(--text-mid)', marginTop: 12 }}>ホストが進めるのを待っています…</p>
          )}
        </>
      )}

      {state.phase !== 'finished' && (
        <p className="subtitle" style={{ marginTop: 12, fontSize: 12 }}>
          得点: 順位ぴったり{POINTS.sanrentan} / 3つ当て{POINTS.sanrenpuku} / 1・2位{POINTS.nirentan} / 2つ当て{POINTS.pukupuku} / 1つ当て{POINTS.tan}
        </p>
      )}
    </div>
  )
}
