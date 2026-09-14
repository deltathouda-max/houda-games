export const SIZE = 8

const DIRS = [
  [-1, -1], [-1, 0], [-1, 1],
  [0, -1], [0, 1],
  [1, -1], [1, 0], [1, 1],
]

function inBounds(r, c) { return r >= 0 && r < SIZE && c >= 0 && c < SIZE }

export function opponent(color) { return color === 'black' ? 'white' : 'black' }

export function createInitialBoard() {
  const b = Array(SIZE * SIZE).fill(null)
  b[3 * SIZE + 3] = 'white'
  b[3 * SIZE + 4] = 'black'
  b[4 * SIZE + 3] = 'black'
  b[4 * SIZE + 4] = 'white'
  return b
}

// 指定マスに color を置いたときに裏返る石のインデックス一覧。空配列なら着手不可。
export function getFlips(board, row, col, color) {
  if (board[row * SIZE + col] !== null) return []
  const opp = opponent(color)
  const flips = []
  for (const [dr, dc] of DIRS) {
    let r = row + dr, c = col + dc
    const line = []
    while (inBounds(r, c) && board[r * SIZE + c] === opp) {
      line.push(r * SIZE + c)
      r += dr; c += dc
    }
    if (line.length > 0 && inBounds(r, c) && board[r * SIZE + c] === color) flips.push(...line)
  }
  return flips
}

export function getLegalMoves(board, color) {
  const moves = []
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (getFlips(board, r, c, color).length > 0) moves.push(r * SIZE + c)
    }
  }
  return moves
}

export function applyMove(board, row, col, color) {
  const flips = getFlips(board, row, col, color)
  const next = [...board]
  next[row * SIZE + col] = color
  flips.forEach((i) => { next[i] = color })
  return next
}

export function countDiscs(board) {
  let black = 0, white = 0
  board.forEach((v) => { if (v === 'black') black++; else if (v === 'white') white++ })
  return { black, white }
}
