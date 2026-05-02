import { useState, useRef, useCallback } from 'react'
import { createWorker } from 'tesseract.js'

function levenshtein(a, b) {
  const m = a.length, n = b.length
  if (m === 0) return n
  if (n === 0) return m
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0))
  for (let i = 0; i <= m; i++) dp[i][0] = i
  for (let j = 0; j <= n; j++) dp[0][j] = j
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])
    }
  }
  return dp[m][n]
}

function similarity(a, b) {
  if (!a || !b) return 0
  const dist = levenshtein(a, b)
  const maxLen = Math.max(a.length, b.length)
  return maxLen === 0 ? 1 : 1 - dist / maxLen
}

function normalize(str) {
  return str.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function CardScanner({ cards, onSelect, onClose }) {
  const [image, setImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [scanning, setScanning] = useState(false)
  const [progress, setProgress] = useState(0)
  const [results, setResults] = useState([])
  const [error, setError] = useState(null)
  const [step, setStep] = useState('idle')
  const [debugText, setDebugText] = useState('')
  const fileInputRef = useRef(null)
  const workerRef = useRef(null)

  const handleImageSelect = useCallback((e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (ev) => {
      setImage(ev.target.result)
      setImagePreview(ev.target.result)
      setStep('captured')
      setResults([])
      setError(null)
      setDebugText('')
    }
    reader.readAsDataURL(file)
  }, [])

  const handleCameraCapture = useCallback(() => {
    fileInputRef.current?.setAttribute('capture', 'environment')
    fileInputRef.current?.click()
  }, [])

  const handleFileUpload = useCallback(() => {
    fileInputRef.current?.removeAttribute('capture')
    fileInputRef.current?.click()
  }, [])

  const cropCardArea = (imageDataUrl) => {
    return new Promise((resolve) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')

        const targetWidth = 600
        const scale = targetWidth / img.width
        const tw = targetWidth
        const th = img.height * scale

        canvas.width = tw
        canvas.height = th
        ctx.drawImage(img, 0, 0, tw, th)

        const imageData = ctx.getImageData(0, 0, tw, th)
        const data = imageData.data

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i], g = data[i + 1], b = data[i + 2]
          const lum = 0.299 * r + 0.587 * g + 0.114 * b
          const threshold = 140
          const v = lum > threshold ? 255 : 0
          data[i] = v
          data[i + 1] = v
          data[i + 2] = v
        }

        ctx.putImageData(imageData, 0, 0)
        resolve(canvas.toDataURL('image/png'))
      }
      img.src = imageDataUrl
    })
  }

  const matchCards = useCallback((ocrText, allCards) => {
    if (!ocrText || !allCards.length) return []

    const normalizedOCR = normalize(ocrText)
    const ocrWords = new Set(normalizedOCR.split(' ').filter(w => w.length > 2))

    const scored = []
    const seen = new Set()

    for (const card of allCards) {
      if (seen.has(card.id)) continue

      const namesToCheck = []
      if (card._ptName) namesToCheck.push({ name: card._ptName, lang: 'pt' })
      if (card.text?.en?.name && card.text.en.name !== card._ptName) {
        namesToCheck.push({ name: card.text.en.name, lang: 'en' })
      }

      let bestSim = 0
      let bestMatch = ''

      for (const { name } of namesToCheck) {
        const normName = normalize(name)

        const simExact = similarity(normalizedOCR, normName)
        if (simExact > bestSim) {
          bestSim = simExact
          bestMatch = name
        }

        const nameWords = normName.split(' ').filter(w => w.length > 2)
        if (nameWords.length > 1) {
          let longestCommon = 0
          for (const nw of nameWords) {
            let bestWordSim = 0
            for (const ow of ocrWords) {
              const ws = similarity(nw, ow)
              if (ws > bestWordSim) bestWordSim = ws
            }
            longestCommon += bestWordSim
          }
          const wordSim = longestCommon / nameWords.length
          const adjustedSim = wordSim * 0.85
          if (adjustedSim > bestSim) {
            bestSim = adjustedSim
            bestMatch = name
          }
        }

        for (const ocrLine of normalizedOCR.split('\n')) {
          const normLine = ocrLine.trim()
          if (normLine.length < 3) continue
          const sim = similarity(normLine, normName)
          if (sim > bestSim) {
            bestSim = sim
            bestMatch = name
          }
        }
      }

      if (bestSim > 0.55) {
        scored.push({ card, score: bestSim, match: bestMatch })
        seen.add(card.id)
      }
    }

    scored.sort((a, b) => b.score - a.score)
    return scored.slice(0, 10).map(s => s.card)
  }, [])

  const runOCR = useCallback(async () => {
    if (!image) return

    setScanning(true)
    setProgress(0)
    setStep('scanning')
    setError(null)
    setDebugText('')

    try {
      if (!workerRef.current) {
        workerRef.current = await createWorker('eng', 1, {
          logger: (m) => {
            if (m.status === 'recognizing text') {
              setProgress(Math.round(m.progress * 100))
            }
          }
        })
      }

      await workerRef.current.setParameters({
        tessedit_pageseg_mode: '6',
      })

      const processedImage = await cropCardArea(image)
      const { data: { text } } = await workerRef.current.recognize(processedImage)

      setDebugText(text)

      const trimmed = text.trim()
      if (!trimmed || trimmed.length < 3) {
        setError('Não foi possível detectar texto na imagem. Tente uma foto mais nítida do nome da carta.')
        setStep('captured')
        return
      }

      const matchedCards = matchCards(trimmed, cards)

      if (matchedCards.length === 0) {
        const preview = trimmed.substring(0, 100)
        setError(`Texto detectado: "${preview}". Nenhuma carta correspondente encontrada. Tente focar no nome da carta.`)
        setStep('captured')
        return
      }

      setResults(matchedCards)
      setStep('done')
    } catch (err) {
      console.error('OCR error:', err)
      setError('Erro ao processar imagem. Tente novamente.')
      setStep('captured')
    } finally {
      setScanning(false)
      setProgress(0)
    }
  }, [image, cards, matchCards])

  const reset = () => {
    setImage(null)
    setImagePreview(null)
    setResults([])
    setError(null)
    setDebugText('')
    setStep('idle')
    setProgress(0)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div className="scanner-modal" onClick={onClose}>
      <div className="scanner-modal-content" onClick={e => e.stopPropagation()}>
        <div className="scanner-header">
          <h3>Escanear Carta</h3>
          <button className="scanner-close" onClick={onClose}>×</button>
        </div>

        <div className="scanner-body">
          {step === 'idle' && (
            <div className="scanner-options">
              <div className="scanner-icon-large">📷</div>
              <p className="scanner-description">
                Tire uma foto ou envie uma imagem da carta. O app vai ler o nome e encontrar a carta no banco de dados.
              </p>
              <div className="scanner-buttons">
                <button className="scanner-btn camera" onClick={handleCameraCapture}>
                  <span className="scanner-btn-icon-inner">📸</span>
                  <span>Tirar Foto da Carta</span>
                </button>
                <button className="scanner-btn upload" onClick={handleFileUpload}>
                  <span className="scanner-btn-icon-inner">📁</span>
                  <span>Enviar Imagem</span>
                </button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                style={{ display: 'none' }}
              />
              <div className="scanner-tips">
                <h4>Dicas para melhor resultado:</h4>
                <ul>
                  <li>Foque no <strong>nome</strong> da carta (parte superior)</li>
                  <li>Foto bem iluminada e nítida</li>
                  <li>Carte centralizada e reta</li>
                  <li>Evite reflexos e sombras</li>
                </ul>
              </div>
            </div>
          )}

          {step === 'captured' && (
            <div className="scanner-preview">
              <img src={imagePreview} alt="Preview" className="scanner-image" />
              {error && <div className="scanner-error">{error}</div>}
              {debugText && step === 'captured' && (
                <details className="scanner-debug">
                  <summary>Ver texto detectado (debug)</summary>
                  <pre>{debugText}</pre>
                </details>
              )}
              <div className="scanner-actions">
                <button className="scanner-btn secondary" onClick={reset}>
                  Trocar Foto
                </button>
                <button className="scanner-btn primary" onClick={runOCR} disabled={scanning}>
                  Identificar Carta
                </button>
              </div>
            </div>
          )}

          {step === 'scanning' && (
            <div className="scanner-progress">
              <img src={imagePreview} alt="Scanning" className="scanner-image scanning" />
              <div className="scanner-progress-bar">
                <div className="progress-fill" style={{ width: `${progress}%` }}></div>
              </div>
              <p className="scanner-progress-text">
                Processando imagem... {progress}%
              </p>
              <p className="scanner-progress-hint">
                A primeira vez pode demorar mais (baixando modelo OCR)
              </p>
            </div>
          )}

          {step === 'done' && results.length > 0 && (
            <div className="scanner-results">
              <h4>Cartas encontradas ({results.length})</h4>
              <p className="scanner-results-hint">
                Selecione a carta correta:
              </p>
              <div className="scanner-results-grid">
                {results.map(card => (
                  <div
                    key={card.id}
                    className="scanner-result-card"
                    onClick={() => {
                      onSelect(card)
                      onClose()
                    }}
                  >
                    <img src={card._image} alt={card._ptName} loading="lazy" />
                    <div className="scanner-result-name">{card._ptName}</div>
                    <div className="scanner-result-type">{card.cardType}</div>
                  </div>
                ))}
              </div>
              {debugText && (
                <details className="scanner-debug">
                  <summary>Ver texto detectado (debug)</summary>
                  <pre>{debugText}</pre>
                </details>
              )}
              <button className="scanner-btn secondary full-width" onClick={reset}>
                Escanear Outra Carta
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default CardScanner
