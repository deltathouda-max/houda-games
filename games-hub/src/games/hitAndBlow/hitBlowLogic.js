export function isValidCode(code) {
  return /^[0-9]{3}$/.test(code) && new Set(code).size === 3
}

export function computeHitsBlows(guess, secret) {
  let hits = 0
  const secretRest = []
  const guessRest = []
  for (let i = 0; i < 3; i++) {
    if (guess[i] === secret[i]) hits++
    else { secretRest.push(secret[i]); guessRest.push(guess[i]) }
  }
  let blows = 0
  const pool = [...secretRest]
  guessRest.forEach((d) => {
    const idx = pool.indexOf(d)
    if (idx !== -1) { blows++; pool.splice(idx, 1) }
  })
  return { hits, blows }
}
