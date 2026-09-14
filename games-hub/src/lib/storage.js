const NAME_KEY = 'games-hub:name'

// プライベートブラウジング等でlocalStorageが使えない場合もあるため、失敗しても無視して素通りする
export function getSavedName() {
  try {
    return localStorage.getItem(NAME_KEY) ?? ''
  } catch {
    return ''
  }
}

export function saveName(name) {
  try {
    localStorage.setItem(NAME_KEY, name)
  } catch {
    // 保存できなくても致命的ではないので無視する
  }
}
