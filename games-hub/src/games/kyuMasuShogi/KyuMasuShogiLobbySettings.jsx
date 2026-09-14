import { updateSettings } from '../../lib/room.js'
import { PRESETS } from './kyuMasuShogiLogic.js'

export default function KyuMasuShogiLobbySettings({ code, room }) {
  const selected = room.settings?.shogiPreset ?? PRESETS[0].id
  return (
    <>
      <div style={{ marginTop: 20, marginBottom: 8, fontSize: 13, color: 'var(--text-mid)' }}>初期配置</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {PRESETS.map((p) => (
          <button
            key={p.id}
            className="game-item"
            style={selected === p.id ? { borderColor: 'var(--amber-500)', background: 'rgba(245,166,35,0.08)' } : {}}
            onClick={() => updateSettings(code, { shogiPreset: p.id })}
          >
            <div style={{ flex: 1 }}>
              <div className="game-item-name">{p.name}</div>
              <div className="game-item-desc">{p.desc}</div>
            </div>
            {selected === p.id && <span className="badge">選択中</span>}
          </button>
        ))}
      </div>
    </>
  )
}
