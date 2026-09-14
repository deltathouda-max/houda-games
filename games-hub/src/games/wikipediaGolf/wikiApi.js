const API_BASE = 'https://ja.wikipedia.org/w/api.php'

// メイン名前空間(通常記事)以外はゴルフの対象外にする
const EXCLUDED_PREFIXES = [
  'File:', 'ファイル:', 'Category:', 'カテゴリ:', 'Help:', 'ヘルプ:',
  'Wikipedia:', 'Template:', 'テンプレート:', 'Portal:', 'ポータル:',
  'Special:', '特別:', 'Talk:', 'ノート:', 'Draft:', '利用者:', 'User:',
  'Media:', 'MediaWiki:', 'TimedText:', 'Module:', 'モジュール:',
]

export function normalizeTitle(title) {
  return decodeURIComponent(title).replace(/_/g, ' ').trim()
}

export function isArticleLink(href) {
  if (!href || !href.startsWith('/wiki/')) return false
  const title = normalizeTitle(href.slice('/wiki/'.length).split('#')[0])
  if (!title || title.includes(':')) return false
  return !EXCLUDED_PREFIXES.some((p) => title.startsWith(p))
}

export function titleFromHref(href) {
  return normalizeTitle(href.slice('/wiki/'.length).split('#')[0])
}

export async function fetchArticle(title) {
  const url = `${API_BASE}?action=parse&page=${encodeURIComponent(title)}&format=json&origin=*&formatversion=2&redirects=1&prop=text%7Cdisplaytitle`
  const res = await fetch(url)
  const data = await res.json()
  if (data.error) throw new Error(data.error.info || '記事の取得に失敗しました')
  return {
    title: data.parse.title,
    displayTitle: data.parse.displaytitle,
    html: data.parse.text,
  }
}
