import { updateSettings } from '../../lib/room.js'

const TALK_OPTIONS = [30, 60, 90, 120]

export default function WordDropLobbySettings({ code, room }) {
  const selected = room.settings?.talkSeconds ?? 60
  return (
    <>
      <div style={{ marginTop: 20, marginBottom: 8, fontSize: 13, color: 'var(--text-mid)' }}>フリートークの時間</div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {TALK_OPTIONS.map((sec) => (
          <button
            key={sec}
            className="btn btn-ghost"
            style={selected === sec ? { borderColor: 'var(--amber-500)', color: 'var(--amber-400)' } : {}}
            onClick={() => updateSettings(code, { talkSeconds: sec })}
          >
            {sec}秒
          </button>
        ))}
      </div>
    </>
  )
}
