// 非対応ブラウザ(PC等)では navigator.vibrate 自体が存在しないため、呼べる時だけ呼ぶ
export function vibrateShort() {
  try {
    navigator.vibrate?.(50)
  } catch {
    // 無視してよい
  }
}

export function vibrateSuccess() {
  try {
    navigator.vibrate?.([40, 40, 80])
  } catch {
    // 無視してよい
  }
}
