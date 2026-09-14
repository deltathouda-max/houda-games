export const COLS = 7
export const ROWS = 6
const idx = (r, c) => r * COLS + c

export function createInitialState() {
  return { board: Array(COLS * ROWS).fill(null), turn: 'first', winner: null }
}

export function lowestEmptyRow(board, col) {
  for (let r = ROWS - 1; r >= 0; r--) if (!board[idx(r, col)]) return r
  return -1
}

const DIRS = [[0, 1], [1, 0], [1, 1], [1, -1]] // 横・縦・斜め2方向(逆向きも合わせて数える)

function countDir(board, r, c, dr, dc, owner) {
  let count = 0
  let rr = r + dr, cc = c + dc
  while (rr >= 0 && rr < ROWS && cc >= 0 && cc < COLS && board[idx(rr, cc)] === owner) {
    count++; rr += dr; cc += dc
  }
  return count
}

function isWinningMove(board, r, c, owner) {
  return DIRS.some(([dr, dc]) => 1 + countDir(board, r, c, dr, dc, owner) + countDir(board, r, c, -dr, -dc, owner) >= 4)
}

export function applyDrop(state, col) {
  const row = lowestEmptyRow(state.board, col)
  if (row < 0) return state
  const board = [...state.board]
  board[idx(row, col)] = state.turn
  const won = isWinningMove(board, row, col, state.turn)
  const full = board.every((v) => v !== null)
  return {
    board,
    turn: won ? state.turn : state.turn === 'first' ? 'second' : 'first',
    winner: won ? state.turn : full ? 'draw' : null,
  }
}
