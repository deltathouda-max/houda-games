import { useEffect, useState } from 'react'
import QRCode from 'qrcode'

function inviteUrl(code) {
  const url = new URL(window.location.href)
  url.search = ''
  url.searchParams.set('room', code)
  return url.toString()
}

export default function InviteBlock({ code }) {
  const [qrDataUrl, setQrDataUrl] = useState(null)
  const [copied, setCopied] = useState(false)
  const url = inviteUrl(code)

  useEffect(() => {
    let cancelled = false
    QRCode.toDataURL(url, { width: 160, margin: 1 })
      .then((dataUrl) => { if (!cancelled) setQrDataUrl(dataUrl) })
      .catch(() => {})
    return () => { cancelled = true }
  }, [url])

  async function handleShare() {
    if (navigator.share) {
      try {
        await navigator.share({ title: 'ほうだのゲーム集', text: `合言葉「${code}」で参加してね`, url })
      } catch {
        // ユーザーがキャンセルした場合等は何もしない
      }
      return
    }
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // クリップボードが使えない環境では何もしない
    }
  }

  return (
    <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px dashed var(--dq-border-dim)', textAlign: 'center' }}>
      {qrDataUrl && (
        <div style={{ display: 'inline-block', background: '#fff', padding: 8, borderRadius: 2, marginBottom: 10 }}>
          <img src={qrDataUrl} alt="参加用QRコード" width={140} height={140} />
        </div>
      )}
      <div>
        <button className="btn btn-ghost" onClick={handleShare} style={{ width: '100%' }}>
          {copied ? 'コピーしました!' : '友達を誘う'}
        </button>
      </div>
    </div>
  )
}
