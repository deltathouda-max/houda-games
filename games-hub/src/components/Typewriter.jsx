import { useEffect, useState } from 'react'

// ドラクエ風に文字を1文字ずつ表示する。textが変わるたびに最初からやり直す
export default function Typewriter({ text, speed = 28, className }) {
  const [shown, setShown] = useState('')

  useEffect(() => {
    setShown('')
    if (!text) return
    let i = 0
    const timer = setInterval(() => {
      i += 1
      setShown(text.slice(0, i))
      if (i >= text.length) clearInterval(timer)
    }, speed)
    return () => clearInterval(timer)
  }, [text, speed])

  return <span className={className}>{shown}</span>
}
