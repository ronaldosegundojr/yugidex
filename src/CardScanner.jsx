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

const OCR_CONF_MIN = 50

const WHITELIST =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz" +
  "ÀÁÂÃÇÉÊÍÓÔÕÚÜàáâãçéêíóôõúü" +
  "0123456789 .,;:-_()'\"&/"

function otsuThreshold(gray) {
  const hist = new Array(256).fill(0)
  let total = gray.length
  for (let i = 0; i < total; i++) hist[gray[i]]++

  let sum = 0
  for (let t = 0; t < 256; t++) sum += t * hist[t]

  let sumB = 0
  let wB = 0
  let maxVar = 0
  let threshold = 128

  for (let t = 0; t < 256; t++) {
    wB += hist[t]
    if (wB === 0) continue
    const wF = total - wB
    if (wF === 0) break
    sumB += t * hist[t]
    const mB = sumB / wB
    const mF = (sum - sumB) / wF
    const between = wB * wF * (mB - mF) * (mB - mF)
    if (between > maxVar) {
      maxVar = between
      threshold = t
    }
  }
  return threshold
}

function contrastStretch(gray) {
  let min = 255
  let max = 0
  for (let i = 0; i < gray.length; i++) {
    if (gray[i] < min) min = gray[i]
    if (gray[i] > max) max = gray[i]
  }
  const range = max - min || 1
  for (let i = 0; i < gray.length; i++) {
    gray[i] = ((gray[i] - min) * 255) / range
  }
  return gray
}

function preprocessForOCR(imageDataUrl, { binarize = false } = {}) {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const targetWidth = 1200
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')

      const tw = targetWidth
      const th = Math.max(1, Math.round(img.height * (tw / img.width)))

      canvas.width = tw
      canvas.height = th
      ctx.drawImage(img, 0, 0, tw, th)

      const imageData = ctx.getImageData(0, 0, tw, th)
      const d = imageData.data
      const gray = new Uint8ClampedArray(tw * th)

      for (let i = 0; i < d.length; i += 4) {
        gray[i / 4] = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]
      }

      contrastStretch(gray)

      if (binarize) {
        const thresh = otsuThreshold(gray)
        for (let i = 0; i < gray.length; i++) {
          gray[i] = gray[i] > thresh ? 255 : 0
        }
      }

      for (let i = 0; i < d.length; i += 4) {
        const v = gray[i / 4]
        d[i] = v
        d[i + 1] = v
        d[i + 2] = v
      }
      ctx.putImageData(imageData, 0, 0)
      resolve(canvas.toDataURL('image/png'))
    }
    img.src = imageDataUrl
  })
}

function extractLines(data) {
  const lines = []
  const blocks = data.blocks || []
  for (const block of blocks) {
    if (!block.paragraphs) continue
    for (const para of block.paragraphs) {
      if (!para.lines) continue
      for (const line of para.lines) {
        if (!line.words || !line.words.length) continue
        const kept = line.words
          .filter(w => w.confidence >= OCR_CONF_MIN)
          .sort((a, b) => a.bbox.x0 - b.bbox.x0)
          .map(w => w.text)
          .join(' ')
        if (kept.trim().length >= 3) {
          lines.push({ text: kept.trim(), confidence: line.confidence, bbox: line.bbox })
        }
      }
    }
  }
  lines.sort((a, b) => a.bbox.y0 - b.bbox.y0)
  return lines
}

function formatDebug(lines, fullText, confidence, pass) {
  const lineList = lines
    .map((l, i) => `${i + 1}. [conf ${Math.round(l.confidence)}] ${l.text}`)
    .join('\n')
  return (
    `Passe ${pass} | Confiança média da página: ${confidence ? Math.round(confidence) + '%' : '?'}` +
    `\n\nLinhas detectadas:\n${lineList || '(nenhuma linha acima do limiar)'}` +
    `\n\nTexto completo:\n${(fullText || '').trim() || '(vazio)'}`
  )
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

  const matchCards = useCallback((lines, allCards) => {
    if (!lines.length || !allCards.length) return []

    const fullText = lines.map(l => l.text).join('\n')
    const normalizedOCR = normalize(fullText)
    const ocrWords = new Set(normalizedOCR.split(' ').filter(w => w.length > 2))

    const scored = []
    const seen = new Set()

    for (const card of allCards) {
      if (seen.has(card.id)) continue

      const namesToCheck = []
      if (card._ptName) namesToCheck.push(card._ptName)
      if (card.text?.en?.name) {
        const enNorm = normalize(card.text.en.name)
        const ptNorm = normalize(card._ptName || '')
        if (enNorm && enNorm !== ptNorm) namesToCheck.push(card.text.en.name)
      }

      let bestSim = 0
      let bestMatch = ''

      for (const name of namesToCheck) {
        const normName = normalize(name)

        const simExact = similarity(normalizedOCR, normName)
        if (simExact > bestSim) {
          bestSim = simExact
          bestMatch = name
        }

        lines.forEach((line, idx) => {
          const normLine = normalize(line.text)
          if (normLine.length < 3) return
          const boost = idx === 0 ? 0.04 : 0
          const sim = similarity(normLine, normName) + boost
          if (sim > bestSim) {
            bestSim = sim
            bestMatch = name
          }
        })

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
          if (wordSim * 0.85 > bestSim) {
            bestSim = wordSim * 0.85
            bestMatch = name
          }
        }
      }

      if (bestSim > 0.52) {
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
        workerRef.current = await createWorker(['por', 'eng'], 1, {
          logger: (m) => {
            if (m.status === 'recognizing text') {
              setProgress(Math.round(m.progress * 100))
            }
          }
        })
      }

      await workerRef.current.setParameters({
        tessedit_pageseg_mode: '3',
        tessedit_char_whitelist: WHITELIST,
        user_defined_dpi: '300'
      })

      const passes = [
        { binarize: false, rotate: false, psm: '3' },
        { binarize: true, rotate: true, psm: '11' }
      ]

      let lines = []
      let fullText = ''
      let pageConf = 0
      let usedPass = 0
      let matchedCards = []

      for (let i = 0; i < passes.length; i++) {
        const pass = passes[i]
        setProgress(0)
        try {
          await workerRef.current.setParameters({ tessedit_pageseg_mode: pass.psm })

          const processed = await preprocessForOCR(image, { binarize: pass.binarize })
          const { data } = await workerRef.current.recognize(
            processed,
            { rotateAuto: pass.rotate },
            { text: true, blocks: true }
          )

          lines = extractLines(data)
          fullText = data.text || ''
          pageConf = data.confidence || 0
          usedPass = i + 1
          matchedCards = matchCards(lines, cards)

          setDebugText(formatDebug(lines, fullText, pageConf, usedPass))
          if (matchedCards.length > 0) break
        } catch (passErr) {
          console.error('OCR pass error:', passErr)
        }
      }

      if (matchedCards.length === 0) {
        const trimmed = (fullText || '').trim()
        if (!trimmed || trimmed.length < 3) {
          setError('Não foi possível detectar o nome da carta. Tente uma foto mais nítida, com a carta reta e o nome bem visível.')
        } else {
          const preview = trimmed.substring(0, 100).replace(/\s+/g, ' ')
          setError(`Texto detectado: "${preview}". Nenhuma carta correspondente. Tente focar no nome da carta (primeira linha).`)
        }
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
                  <li>Carta centralizada e <strong>na posição correta (em pé)</strong></li>
                  <li>Evite reflexos, sombras e inclinação</li>
                  <li>Funciona com cartas em <strong>português ou inglês</strong></li>
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
                A primeira vez pode demorar mais (baixando modelo OCR de português e inglês)
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