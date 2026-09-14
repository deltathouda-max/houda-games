// アセット不要でWeb Audio APIから直接8bit風のビープ音を鳴らす。
// ブラウザの自動再生制限があるため、最初のユーザー操作(クリック)以降でのみ実際に鳴る。
let ctx = null

function getCtx() {
  if (typeof window === 'undefined') return null
  if (!ctx) {
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)()
    } catch {
      return null
    }
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {})
  return ctx
}

function beep({ freq, duration, delay = 0, gain = 0.05, type = 'square' }) {
  const audioCtx = getCtx()
  if (!audioCtx) return
  const osc = audioCtx.createOscillator()
  const g = audioCtx.createGain()
  osc.type = type
  osc.frequency.value = freq
  osc.connect(g)
  g.connect(audioCtx.destination)
  const start = audioCtx.currentTime + delay
  g.gain.setValueAtTime(gain, start)
  g.gain.exponentialRampToValueAtTime(0.0001, start + duration)
  osc.start(start)
  osc.stop(start + duration)
}

export function playDecide() {
  beep({ freq: 880, duration: 0.06 })
}

export function playFanfare() {
  const notes = [523.25, 659.25, 783.99, 1046.5] // C5-E5-G5-C6の上昇アルペジオ
  notes.forEach((freq, i) => beep({ freq, duration: 0.16, delay: i * 0.09, gain: 0.06 }))
}
