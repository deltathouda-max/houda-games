import { updateSettings } from '../../lib/room.js'

const TIMER_OPTIONS = [
  { value: 60, label: '60秒' },
  { value: 90, label: '90秒' },
  { value: 120, label: '120秒' },
]

export default function SoreGaSeikaiLobbySettings({ code, room }) {
  return (
    <>
      <div style={{ marginTop: 20, marginBottom: 8, fontSize: 13, color: 'var(--text-mid)' }}>回答の制限時間</div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {TIMER_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            className="btn btn-ghost"
            style={room.settings?.timerSeconds === opt.value ? { borderColor: 'var(--amber-500)', color: 'var(--amber-400)' } : {}}
            onClick={() => updateSettings(code, { timerSeconds: opt.value })}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </>
  )
}
