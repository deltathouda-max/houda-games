// スマホでの入力しやすさを優先し、数字のみ3桁にしている(部屋数が少ない友達内利用の前提)。
export function generateRoomCode(length = 3) {
  let code = ''
  for (let i = 0; i < length; i++) {
    code += Math.floor(Math.random() * 10)
  }
  return code
}
