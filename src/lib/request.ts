function apiUrl(path: string): string {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL ?? ''
  if (!base) throw new Error('NEXT_PUBLIC_API_BASE_URL is not set')
  const p = path.startsWith('/') ? path : `/${path}`
  return `${base.replace(/\/$/, '')}${p}`
}

export async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = apiUrl(path)
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })
  // Read body exactly once (consuming twice causes "Body has already been read")
  const text = await res.text()
  if (!res.ok) {
    let msg = text
    try {
      const j = JSON.parse(text)
      if (j && typeof j.error === 'string') msg = j.error
    } catch {
      // use text as-is
    }
    throw new Error(msg || `HTTP ${res.status}`)
  }
  if (!text) return undefined as T
  return JSON.parse(text) as T
}
