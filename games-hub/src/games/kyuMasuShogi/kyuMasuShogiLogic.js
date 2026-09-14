export const SIZE = 3
const idx = (r, c) => r * SIZE + c
const inBounds = (r, c) => r >= 0 && r < SIZE && c >= 0 && c < SIZE
const ALL8 = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]]

// 将棋と同じ8種類の駒の動きを、3x3盤向けに汎用実装する。
// slide系(飛・角・香とその成り)は盤が小さいので実質2マスまでしか進まない。
function forwardDelta(owner) { return owner === 'first' ? -1 : 1 }

function moveSpec(moveKind, owner) {
  const f = forwardDelta(owner)
  switch (moveKind) {
    case 'king': return { slide: false, dirs: ALL8 }
    case 'gold': return { slide: false, dirs: [[f, 0], [-f, 0], [0, -1], [0, 1], [f, -1], [f, 1]] }
    case 'silver': return { slide: false, dirs: [[f, 0], [f, -1], [f, 1], [-f, -1], [-f, 1]] }
    case 'pawn': return { slide: false, dirs: [[f, 0]] }
    case 'knight': return { slide: false, dirs: [[2 * f, -1], [2 * f, 1]] }
    case 'rook': return { slide: true, dirs: [[-1, 0], [1, 0], [0, -1], [0, 1]] }
    case 'bishop': return { slide: true, dirs: [[-1, -1], [-1, 1], [1, -1], [1, 1]] }
    case 'lance': return { slide: true, dirs: [[f, 0]] }
    case 'promRook': return { slide: true, dirs: [[-1, 0], [1, 0], [0, -1], [0, 1]], extraStep: [[-1, -1], [-1, 1], [1, -1], [1, 1]] }
    case 'promBishop': return { slide: true, dirs: [[-1, -1], [-1, 1], [1, -1], [1, 1]], extraStep: [[-1, 0], [1, 0], [0, -1], [0, 1]] }
    default: return { slide: false, dirs: [] }
  }
}

// 成れる駒: 飛・角・銀・桂・香・歩(王・金は成れない)
const PROMOTABLE = new Set(['rook', 'bishop', 'silver', 'knight', 'lance', 'pawn'])

function effectiveMoveKind(piece) {
  if (!piece.promoted) return piece.kind
  if (piece.kind === 'rook') return 'promRook'
  if (piece.kind === 'bishop') return 'promBishop'
  return 'gold' // 銀・桂・香・歩は成ると金と同じ動き
}

export const PIECE_LABEL = {
  king: { first: '王', second: '玉' },
  gold: '金', silver: '銀', knight: '桂', lance: '香', pawn: '歩', rook: '飛', bishop: '角',
}
export const PROMOTED_LABEL = { silver: '全', knight: '圭', lance: '杏', pawn: 'と', rook: '龍', bishop: '馬' }

export function pieceLabel(piece) {
  if (piece.kind === 'king') return PIECE_LABEL.king[piece.owner]
  if (piece.promoted) return PROMOTED_LABEL[piece.kind]
  return PIECE_LABEL[piece.kind]
}

// 初期配置プリセット: 盤の一番奥の列(自陣)に[左, 王, 右]を置き、中段は空けておく
// (中段まで駒を置くと、盤が3段しかないため相手側と初期配置が重なってしまうため)
export const PRESETS = [
  { id: 'easy', name: 'かんたん', desc: '金将と歩兵で王を守る、初心者向け。歩の成り・持ち駒も試しやすい', row: ['gold', 'king', 'pawn'] },
  { id: 'normal', name: 'ふつう', desc: '銀将は斜め移動が強く、やや駆け引きが増える', row: ['silver', 'king', 'pawn'] },
  { id: 'advanced', name: 'じょうきゅう', desc: '飛車と角行の遠距離コンビ。決着が速い', row: ['rook', 'king', 'bishop'] },
  { id: 'chaos', name: 'とっぱ', desc: '香車の直進で一気に攻め込む', row: ['lance', 'king', 'gold'] },
]

export function createInitialState(presetId) {
  const preset = PRESETS.find((p) => p.id === presetId) ?? PRESETS[0]
  const board = Array(SIZE * SIZE).fill(null)
  preset.row.forEach((kind, c) => { board[idx(0, c)] = { kind, promoted: false, owner: 'second' } })
  preset.row.forEach((kind, c) => { board[idx(SIZE - 1, c)] = { kind, promoted: false, owner: 'first' } })
  return { board, hands: { first: [], second: [] }, turn: 'first', winner: null, presetId: preset.id }
}

export function legalMoveTargets(state, r, c) {
  const piece = state.board[idx(r, c)]
  if (!piece) return []
  const spec = moveSpec(effectiveMoveKind(piece), piece.owner)
  const targets = []
  if (!spec.slide) {
    for (const [dr, dc] of spec.dirs) {
      const nr = r + dr, nc = c + dc
      if (!inBounds(nr, nc)) continue
      const t = state.board[idx(nr, nc)]
      if (t && t.owner === piece.owner) continue
      targets.push([nr, nc])
    }
    return targets
  }
  for (const [dr, dc] of spec.dirs) {
    let nr = r + dr, nc = c + dc
    while (inBounds(nr, nc)) {
      const t = state.board[idx(nr, nc)]
      if (!t) { targets.push([nr, nc]); nr += dr; nc += dc; continue }
      if (t.owner !== piece.owner) targets.push([nr, nc])
      break
    }
  }
  if (spec.extraStep) {
    for (const [dr, dc] of spec.extraStep) {
      const nr = r + dr, nc = c + dc
      if (!inBounds(nr, nc)) continue
      const t = state.board[idx(nr, nc)]
      if (t && t.owner === piece.owner) continue
      targets.push([nr, nc])
    }
  }
  return targets
}

export function canDropAt(state, owner, kind, r, c) {
  if (state.board[idx(r, c)]) return false
  if (kind === 'pawn') {
    for (let rr = 0; rr < SIZE; rr++) {
      const p = state.board[idx(rr, c)]
      if (p && p.owner === owner && p.kind === 'pawn' && !p.promoted) return false // 二歩禁止
    }
  }
  return true
}

export function applyMove(state, [fr, fc], [tr, tc]) {
  const board = state.board.map((p) => (p ? { ...p } : null))
  const piece = board[idx(fr, fc)]
  const captured = board[idx(tr, tc)]
  const hands = { first: [...state.hands.first], second: [...state.hands.second] }
  let winner = null
  if (captured) {
    if (captured.kind === 'king') winner = piece.owner
    else hands[piece.owner] = [...hands[piece.owner], captured.kind]
  }
  board[idx(fr, fc)] = null
  const backRow = piece.owner === 'first' ? 0 : SIZE - 1
  const canPromote = PROMOTABLE.has(piece.kind) && (tr === backRow || fr === backRow)
  const promoted = piece.promoted || (canPromote && tr === backRow)
  board[idx(tr, tc)] = { ...piece, promoted }
  const turn = winner ? state.turn : piece.owner === 'first' ? 'second' : 'first'
  return { ...state, board, hands, turn, winner }
}

export function applyDrop(state, owner, kind, r, c) {
  const board = state.board.map((p) => (p ? { ...p } : null))
  board[idx(r, c)] = { kind, promoted: false, owner }
  const hands = { first: [...state.hands.first], second: [...state.hands.second] }
  hands[owner].splice(hands[owner].indexOf(kind), 1)
  const turn = owner === 'first' ? 'second' : 'first'
  return { ...state, board, hands, turn }
}
