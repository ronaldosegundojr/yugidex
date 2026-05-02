import { useState, useRef, useCallback } from 'react'
import { createWorker } from 'tesseract.js'

function CardScanner({ cards, onSelect, onClose }) {
  const [image, setImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [scanning, setScanning] = useState(false)
  const [progress, setProgress] = useState(0)
  const [results, setResults] = useState([])
  const [error, setError] = useState(null)
  const [step, setStep] = useState('idle') // idle, captured, scanning, done
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

  const preprocessImage = (imageDataUrl) => {
    return new Promise((resolve) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')

        const targetWidth = 800
        const scale = targetWidth / img.width
        canvas.width = targetWidth
        canvas.height = img.height * scale

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const data = imageData.data

        for (let i = 0; i < data.length; i += 4) {
          const avg = (data[i] + data[i + 1] + data[i + 2]) / 3
          data[i] = avg > 128 ? 255 : 0
          data[i + 1] = avg > 128 ? 255 : 0
          data[i + 2] = avg > 128 ? 255 : 0
        }

        ctx.putImageData(imageData, 0, 0)
        resolve(canvas.toDataURL('image/png'))
      }
      img.src = imageDataUrl
    })
  }

  const extractCardNames = (text) => {
    const lines = text
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 2)
      .map(line => line.replace(/[^a-zA-Z0-9\s\-:'&]/g, '').trim())
      .filter(line => line.length > 2)

    return [...new Set(lines)]
  }

  const matchCards = useCallback((extractedLines, allCards) => {
    if (!extractedLines.length || !allCards.length) return []

    const scores = []
    const seen = new Set()

    for (const card of allCards) {
      if (seen.has(card.id)) continue

      const cardNames = []
      if (card._ptName) cardNames.push(card._ptName.toLowerCase())
      if (card.text?.en?.name) cardNames.push(card.text.en.name.toLowerCase())
      if (card.text?.ja?.name) cardNames.push(card.text.ja.name.toLowerCase())

      let bestScore = 0
      let matchedLine = ''

      for (const line of extractedLines) {
        const lineLower = line.toLowerCase()

        for (const cardName of cardNames) {
          if (cardName.includes(lineLower) || lineLower.includes(cardName)) {
            const score = Math.max(
              lineLower.length / cardName.length,
              cardName.length / lineLower.length
            )
            if (score > bestScore) {
              bestScore = score
              matchedLine = line
            }
          } else {
            const words1 = lineLower.split(/\s+/)
            const words2 = cardName.split(/\s+/)
            const commonWords = words1.filter(w => w.length > 2 && words2.includes(w))
            if (commonWords.length > 0) {
              const wordScore = (commonWords.length / Math.max(words1.length, words2.length)) * 0.7
              if (wordScore > bestScore) {
                bestScore = wordScore
                matchedLine = line
              }
            }
          }
        }
      }

      if (bestScore > 0.3) {
        scores.push({ card, score: bestScore, matchedLine })
        seen.add(card.id)
      }
    }

    scores.sort((a, b) => b.score - a.score)
    return scores.slice(0, 10).map(s => s.card)
  }, [])

  const runOCR = useCallback(async () => {
    if (!image) return

    setScanning(true)
    setProgress(0)
    setStep('scanning')
    setError(null)

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

      const processedImage = await preprocessImage(image)
      const { data: { text } } = await workerRef.current.recognize(processedImage)

      const extractedLines = extractCardNames(text)

      if (!extractedLines.length) {
        setError('Não foi possível detectar texto na imagem. Tente uma foto mais nítida.')
        setStep('captured')
        return
      }

      const matchedCards = matchCards(extractedLines, cards)

      if (matchedCards.length === 0) {
        setError(`Texto detectado: "${extractedLines.slice(0, 3).join(', ')}", mas nenhuma carta correspondente foi encontrada.`)
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
    setStep('idle')
    setProgress(0)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div className="scanner-modal" onClick={onClose}>
      <div className="scanner-modal-content" onClick={e => e.stopPropagation()}>
        <div className="scanner-header">
          <h3>📷 Escanear Carta</h3>
          <button className="scanner-close" onClick={onClose}>×</button>
        </div>

        <div className="scanner-body">
          {step === 'idle' && (
            <div className="scanner-options">
              <p className="scanner-description">
                Tire uma foto ou envie uma imagem da carta para identificá-la automaticamente.
              </p>
              <div className="scanner-buttons">
                <button className="scanner-btn primary" onClick={handleCameraCapture}>
                  📸 Tirar Foto
                </button>
                <button className="scanner-btn secondary" onClick={handleFileUpload}>
                  📁 Enviar Imagem
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
                  <li>Foto bem iluminada e nítida</li>
                  <li>Carte centralizada e reta</li>
                  <li>Evite reflexos e sombras</li>
                  <li>Nome da carta deve estar visível</li>
                </ul>
              </div>
            </div>
          )}

          {step === 'captured' && (
            <div className="scanner-preview">
              <img src={imagePreview} alt="Preview" className="scanner-image" />
              {error && <div className="scanner-error">{error}</div>}
              <div className="scanner-actions">
                <button className="scanner-btn secondary" onClick={reset}>
                  ↩ Trocar Foto
                </button>
                <button className="scanner-btn primary" onClick={runOCR} disabled={scanning}>
                  🔍 Identificar Carta
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
                Isso pode levar alguns segundos na primeira vez
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
              <button className="scanner-btn secondary full-width" onClick={reset}>
                📷 Escanear Outra Carta
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default CardScanner
