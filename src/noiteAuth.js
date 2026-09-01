export const AUTH_KEY = 'nrd_access_v1'

const ALLOWED_HASHES = new Set([
  'adf4c2f649f68c639e0cb6da959e3d5f',
  'c741bd91fb2a5a67a26dfe8da161dcb',
  '5c98f7635cc7a554619f58ef4932169f',
  '35cc4b8d7be772db51fb4a9da6e73546',
  '22c377843ab40f1027ad22123e311d9c',
  '741b7536c9de401ecb57f654f22c8a5c',
  '1522cd2235a0f039106391ed77efede4',
  'bbed6a5186b2404f2fd964ce3a7d7cb',
  'd8e85aa81a241fbd3ce630252d83fb2',
  '162eff22741830dd7d49b75cca6426',
  '9a20b8f02647b9abc14bdc4e422144da',
  '8cda33615575985d173deca28e54d081',
  '966e5c4b33ce96bbd7ca1159e4f22c22',
  '268966259168032a7e992d5441a511ec',
  '95ac418899a66ea4859c0b00c1ccb751',
  'f832f73324e65eed25e9f517a1e527bf',
  'db4d80c636475606727b13518e33d5b0',
  '4b1f08423767b39db280d148327ec990'
])

export const normalizeName = (name) =>
  (name || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()

function cyrb128(str) {
  let h1 = 1779033703, h2 = 3144134277, h3 = 1013904242, h4 = 2773480762
  for (let i = 0; i < str.length; i++) {
    const k = str.charCodeAt(i)
    h1 = h2 ^ Math.imul(h1 ^ k, 597399067)
    h2 = h3 ^ Math.imul(h2 ^ k, 2869860233)
    h3 = h4 ^ Math.imul(h3 ^ k, 951274213)
    h4 = h1 ^ Math.imul(h4 ^ k, 2716044179)
  }
  h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067)
  h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233)
  h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213)
  h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179)
  return [h1, h2, h3, h4].map(x => (x >>> 0).toString(16)).join('')
}

export const isAuthorized = () => {
  try {
    return sessionStorage.getItem(AUTH_KEY) === '1'
  } catch {
    return false
  }
}

export const authorize = (name) => ALLOWED_HASHES.has(cyrb128(normalizeName(name)))

export const setAuthorized = () => {
  try {
    sessionStorage.setItem(AUTH_KEY, '1')
  } catch {
    // armazenamento indisponível (modo privado, etc.)
  }
}