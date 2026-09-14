// 「盤面表示+交互に手を打つ」ゲーム(オセロ・コネクトフォー・9マス将棋など)で使い回す、
// マス目を並べるだけの土台。ゲームごとのコマの見た目・合法手判定は呼び出し側(renderCell)が持つ。
export default function TurnBoard({ rows, cols, cellPx = 40, gap = 4, renderCell, onCellClick }) {
  const cells = []
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      cells.push(
        <div
          key={`${r}-${c}`}
          onClick={() => onCellClick?.(r, c)}
          style={{
            width: cellPx,
            height: cellPx,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--navy-800)',
            border: '1px solid var(--navy-700)',
            borderRadius: 4,
            cursor: onCellClick ? 'pointer' : 'default',
          }}
        >
          {renderCell(r, c)}
        </div>
      )
    }
  }
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${cols}, ${cellPx}px)`,
        gap,
        margin: '0 auto',
        width: 'fit-content',
      }}
    >
      {cells}
    </div>
  )
}
