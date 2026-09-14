const SAFE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // 紛らわしい 0/O, 1/I を除外

export function generateRoomCode(length = 5) {
  let code = ''
  for (let i = 0; i < length; i++) {
    code += SAFE_CHARS[Math.floor(Math.random() * SAFE_CHARS.length)]
  }
  return code
}
