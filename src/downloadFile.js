const sanitizeFilename = (name, fallback) => {
  const cleaned = String(name || '')
    .replace(/[\\/:*?"<>|]+/g, '_')
    .replace(/\s+/g, ' ')
    .trim()
  return cleaned || fallback
}

const clickDownload = (href, filename, fallback) => {
  const a = document.createElement('a')
  a.href = href
  a.download = sanitizeFilename(filename, fallback)
  a.style.display = 'none'
  document.body.appendChild(a)
  a.click()
  a.remove()
}

export function downloadFile(content, type, filename) {
  const blob = content instanceof Blob ? content : new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  clickDownload(url, filename, 'download')
  setTimeout(() => URL.revokeObjectURL(url), 1500)
}

export function downloadUrl(url, filename) {
  clickDownload(url, filename, 'download')
}
