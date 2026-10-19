// Codigo de compartilhamento de deck: lista de passcodes por secao (main/
// extra/side) em base64 url-safe, para caber no hash da URL.

const toBase64Url = (str) =>
  btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')

const fromBase64Url = (str) => {
  const padded = str.replace(/-/g, '+').replace(/_/g, '/')
  const fixed = padded + '='.repeat((4 - (padded.length % 4)) % 4)
  return atob(fixed)
}

const SECTION_KEYS = { m: 'main', e: 'extra', s: 'side' }
const SECTION_CODES = { main: 'm', extra: 'e', side: 's' }

// sections: { main: ['89631139', ...], extra: [], side: [] } (1 passcode por copia)
export const encodeDeckCode = (sections = {}) => {
  const parts = Object.entries(SECTION_CODES).map(
    ([key, short]) => `${short}=${(sections[key] || []).join(',')}`,
  )
  return toBase64Url(parts.join(';'))
}

// Devolve { main, extra, side } (arrays de passcodes) ou null se o codigo for invalido.
export const decodeDeckCode = (code) => {
  if (!code) return null
  try {
    const raw = fromBase64Url(String(code).trim())
    const out = { main: [], extra: [], side: [] }
    for (const part of raw.split(';')) {
      const idx = part.indexOf('=')
      if (idx < 0) continue
      const key = SECTION_KEYS[part.slice(0, idx)]
      if (!key) continue
      out[key] = part
        .slice(idx + 1)
        .split(',')
        .map((p) => p.trim())
        .filter(Boolean)
    }
    return out
  } catch {
    return null
  }
}
