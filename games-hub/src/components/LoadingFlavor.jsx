import { useState } from 'react'

const LINES = [
  'つぎの ばめんを よみこみちゅう…',
  'サイコロの めを そろえている…',
  'だれかが とびらを あけるのを まっている…',
  'ルーラの じゅもんを となえている…',
  'しあわせの くつを そうびした!(ような きがする)',
  'スライムが あらわれるのを まっている…',
  'ぼうけんの しょを よみこみちゅう…',
  'つぎの てんかいを かんがえちゅう…',
]

export default function LoadingFlavor() {
  const [line] = useState(() => LINES[Math.floor(Math.random() * LINES.length)])
  return <p className="subtitle">{line}</p>
}
