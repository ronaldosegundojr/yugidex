import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { isAuthorized, authorize, setAuthorized } from './noiteAuth'
import './NoiteDaRapaziada.css'

const ALBUM_DATA = {
  '15-07-2026': {
    title: '15/07/2026 - Primeiro Encontro',
    description: 'O encontro que deu início a tudo',
    photos: 26
  },
  '27-07-2026': {
    title: '27/07/2026 - Segundo Encontro',
    description: 'A continuação da tradição',
    photos: 4
  },
  '17-08-2026': {
    title: '17/08/2026 - Terceiro Encontro',
    description: 'Mais uma noite memorável',
    photos: 9
  },
  '28-08-2026': {
    title: '28/08/2026 - Quarto Encontro',
    description: 'Fechando o mês com chave de ouro',
    photos: 19
  },
  '07-09-2026': {
    title: '07/09/2026 - Quinto Encontro',
    description: 'Feriado especial para celebrar mais uma noite',
    photos: 16,
    cover: '/fotos-noite-rapaziada/07-09-2026/0.jpg'
  }
}

const WHATSAPP_GROUP_URL = 'https://chat.whatsapp.com/K2ikO8MIIeY2BHJrSIFkGM'
const NOITE_VIDEO_URL = '/videos/noite_da_rapaziada.mp4'

const OCCURRED_DATES = new Set([
  '2026-07-15',
  '2026-07-27',
  '2026-08-17',
  '2026-08-28',
  '2026-09-07'
])

const UPCOMING_DATES = new Set([
  '2026-09-25',
  '2026-10-09',
  '2026-10-12'
])

const WEEKDAY_HEADERS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

const MONTH_TITLES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril',
  'Maio', 'Junho', 'Julho', 'Agosto',
  'Setembro', 'Outubro', 'Novembro', 'Dezembro'
]

function CalendarGrid({ month, year }) {
  const firstDay = new Date(year, month, 1)
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const startOffset = firstDay.getDay()
  const monthLabel = `${MONTH_TITLES[month]} ${year}`

  const cells = []
  for (let i = 0; i < startOffset; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  return (
    <div className="calendar-month">
      <h3 className="calendar-month-title">{monthLabel}</h3>
      <div className="calendar-weekdays">
        {WEEKDAY_HEADERS.map(h => <span key={h} className="calendar-weekday">{h}</span>)}
      </div>
      <div className="calendar-days">
        {cells.map((day, i) => {
          if (day === null) {
            return <span key={`empty-${i}`} className="calendar-day empty" />
          }
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
          const isOccurred = OCCURRED_DATES.has(dateStr)
          const isUpcoming = UPCOMING_DATES.has(dateStr)
          const marker = isOccurred ? '×' : (isUpcoming ? '○' : '')
          const cls = `calendar-day${isOccurred ? ' occurred' : ''}${isUpcoming ? ' upcoming' : ''}`
          return (
            <span key={dateStr} className={cls}>
              <span className="calendar-marker">{marker}</span>
              <span className="calendar-day-num">{day}</span>
            </span>
          )
        })}
      </div>
    </div>
  )
}

function NoiteCalendar() {
  return (
    <div className="calendar-section">
      <div className="calendar-section-head">
        <h2>📅 Calendário da Noite</h2>
        <p className="calendar-subtitle">
          As noites acontecem preferencialmente às sextas-feiras, de 15 em 15 dias,
          com raras exceções para feriados. Marque os encontros que você já participou!
        </p>
      </div>
      <div className="calendar-grid-wrapper">
        {[6, 7, 8, 9].map(m => (
          <CalendarGrid key={m} month={m} year={2026} />
        ))}
      </div>
      <div className="calendar-legend">
        <span className="legend-item">
          <span className="legend-symbol occurred">×</span> Noites que já aconteceram
        </span>
        <span className="legend-item">
          <span className="legend-symbol upcoming">○</span> Próximas noites
        </span>
      </div>
    </div>
  )
}

function NoiteVideo() {
  const videoRef = useRef(null)
  const [playFailed, setPlayFailed] = useState(false)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const tryPlay = () => {
      video.muted = true
      const p = video.play()
      if (p !== undefined) {
        p.then(() => {
          video.muted = false
          const sp = video.play()
          if (sp !== undefined) sp.catch(() => {})
        }).catch(() => {
          setPlayFailed(true)
        })
      }
    }

    const onUserInteraction = () => tryPlay()

    tryPlay()
    document.addEventListener('click', onUserInteraction, { once: true })
    document.addEventListener('keydown', onUserInteraction, { once: true })

    return () => {
      document.removeEventListener('click', onUserInteraction)
      document.removeEventListener('keydown', onUserInteraction)
    }
  }, [])

  return (
    <>
      <video
        ref={videoRef}
        className="noite-video"
        src={NOITE_VIDEO_URL}
        controls
        autoPlay
        muted
        playsInline
        loop
        preload="auto"
      >
        Seu navegador não suporta a reprodução de vídeo.
      </video>
      {playFailed && (
        <p className="history-video-hint-video">
          O navegador bloqueou o autoplay com som. Clique no play do vídeo para assistir com som.
        </p>
      )}
    </>
  )
}

function NoiteDaRapaziada() {
  const [showAlbum, setShowAlbum] = useState(null)
  const [albumPhotos, setAlbumPhotos] = useState([])
  const [previews, setPreviews] = useState({})
  const [viewPhotoIndex, setViewPhotoIndex] = useState(null)
  const [loading, setLoading] = useState(false)

  const fetchPhotos = async (date) => {
    try {
      const response = await fetch(`/fotos-noite-rapaziada/${date}/manifest.json`)
      if (response.ok) {
        const data = await response.json()
        return data.photos || []
      }
      return []
    } catch (error) {
      console.error('Erro ao carregar fotos:', error)
      return []
    }
  }

  useEffect(() => {
    const loadAllPreviews = async () => {
      const results = {}
      await Promise.all(
        Object.keys(ALBUM_DATA).map(async (date) => {
          results[date] = await fetchPhotos(date)
        })
      )
      setPreviews(results)
    }
    loadAllPreviews()
  }, [])

  const showPrevPhoto = useCallback(() => {
    setViewPhotoIndex(prev =>
      prev !== null && albumPhotos.length > 0
        ? (prev - 1 + albumPhotos.length) % albumPhotos.length
        : prev
    )
  }, [albumPhotos.length])

  const showNextPhoto = useCallback(() => {
    setViewPhotoIndex(prev =>
      prev !== null && albumPhotos.length > 0
        ? (prev + 1) % albumPhotos.length
        : prev
    )
  }, [albumPhotos.length])

  useEffect(() => {
    if (viewPhotoIndex === null) return
    const onKeyDown = (e) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        showPrevPhoto()
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        showNextPhoto()
      } else if (e.key === 'Escape') {
        e.preventDefault()
        setViewPhotoIndex(null)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [viewPhotoIndex, showPrevPhoto, showNextPhoto])

  const openAlbum = async (date) => {
    setShowAlbum(date)
    if (previews[date]) {
      setAlbumPhotos(previews[date])
      return
    }
    setLoading(true)
    const photos = await fetchPhotos(date)
    setAlbumPhotos(photos)
    setPreviews(prev => ({ ...prev, [date]: photos }))
    setLoading(false)
  }

  const closeAlbum = () => {
    setShowAlbum(null)
    setAlbumPhotos([])
    setViewPhotoIndex(null)
  }

  return (
    <div className="noite-rapaziada-page">
      <div className="header-section">
        <h1>🌙 Noite da Rapaziada</h1>
        <p className="subtitle">Registros dos nossos encontros</p>
      </div>

      <div className="history-section">
        <div className="history-text">
          <p>
            Em <strong>07/07/2026</strong> o <strong>Arthur</strong> nosso anfitrião propôs 
            de fazer reuniões mais frequentes entre os amigos, conforme ele disse:
          </p>
          <blockquote>
            "Este grupo foi criado para institucionalizar uma noite da semana para acontecer a 
            <strong>NOITE DA RAPAZIADA</strong>"
          </blockquote>
          <p>
            A ideia é nos reunir para conversar, jogar, e passar o tempo junto.
            Depois disso começamos a fazer reuniões frequentes a cada 15 dias para jogar 
            e encontrar com os amigos.
          </p>
          <p>
            Abaixo estão os registros de cada um dos encontros para termos um histórico 
            e não perdermos isso.
          </p>
          <div className="history-video">
            <h3 className="history-video-title">🎬 Vídeo da Noite</h3>
            <NoiteVideo />
            <p className="history-video-hint">O vídeo começa automaticamente; ative o som se necessário.</p>
          </div>
          <div className="history-whatsapp">
            <a
              className="whatsapp-btn"
              href={WHATSAPP_GROUP_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className="whatsapp-icon">💬</span>
              Entrar no grupo da Noite da Rapaziada
            </a>
            <p className="whatsapp-hint">
              Fale com um dos criadores para te adicionarem na lista de autorizados.
            </p>
          </div>
        </div>
      </div>

      <NoiteCalendar />

      <div className="albums-section">
        <h2>📸 Álbuns por Data</h2>
        <div className="albums-grid">
          {Object.entries(ALBUM_DATA).map(([date, album]) => {
            const albumPreview = previews[date] || []
            return (
              <div 
                key={date} 
                className="album-card"
                onClick={() => openAlbum(date)}
              >
                <div className="album-cover">
                  <div className={`album-preview-area ${albumPreview.length ? 'has-photos' : ''}`}>
                    {album.cover ? (
                      <img
                        className="album-cover-img"
                        src={album.cover}
                        alt=""
                        loading="lazy"
                        onError={(e) => { e.target.style.display = 'none' }}
                      />
                    ) : albumPreview.length > 0 ? (
                      <div className="album-preview-grid">
                        {albumPreview.slice(0, 6).map((src, i) => (
                          <div key={i} className="album-preview-photo">
                            <img 
                              src={src} 
                              alt=""
                              loading="lazy"
                              onError={(e) => { e.target.style.visibility = 'hidden' }}
                            />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="album-preview-placeholder">📸</div>
                    )}
                  </div>
                  <div className="album-cover-overlay">
                    <span className="album-date">{date}</span>
                    <span className="album-photo-count">{album.photos} fotos</span>
                  </div>
                  <div className="album-open-hint">📂 Abrir álbum</div>
                </div>
                <div className="album-info">
                  <h3>{album.title}</h3>
                  <p>{album.description}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {showAlbum && (
        <div className="album-modal-overlay" onClick={closeAlbum}>
          <div className="album-modal" onClick={(e) => e.stopPropagation()}>
            <div className="album-modal-header">
              <h2>{ALBUM_DATA[showAlbum]?.title || showAlbum}</h2>
              <button className="close-modal-btn" onClick={closeAlbum}>&times;</button>
            </div>
            
            {loading ? (
              <div className="album-loading">Carregando fotos...</div>
            ) : albumPhotos.length === 0 ? (
              <div className="album-empty">
                <p>Nenhuma foto encontrada neste álbum.</p>
              </div>
            ) : (
              <div className="album-photos-grid">
                {albumPhotos.map((photo, index) => (
                  <div key={index} className="album-photo-item" onClick={() => setViewPhotoIndex(index)}>
                    <img 
                      src={photo} 
                      alt={`${showAlbum} - Foto ${index + 1}`}
                      loading="lazy"
                      onError={(e) => { e.target.style.display = 'none' }}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {viewPhotoIndex !== null && albumPhotos[viewPhotoIndex] && (
        <div
          className="photo-viewer-overlay"
          onClick={() => setViewPhotoIndex(null)}
        >
          <button className="photo-viewer-close" onClick={() => setViewPhotoIndex(null)} title="Fechar">&times;</button>

          <button
            className="photo-nav photo-nav-prev"
            onClick={(e) => { e.stopPropagation(); showPrevPhoto() }}
            title="Anterior (←)"
          >&#8249;</button>

          <div className="photo-viewer" onClick={(e) => e.stopPropagation()}>
            <img
              src={albumPhotos[viewPhotoIndex]}
              alt={`Foto ${viewPhotoIndex + 1}`}
            />
            <span className="photo-viewer-hint">
              {viewPhotoIndex + 1} / {albumPhotos.length} · use ← → para navegar · fora ou &times; para fechar
            </span>
          </div>

          <button
            className="photo-nav photo-nav-next"
            onClick={(e) => { e.stopPropagation(); showNextPhoto() }}
            title="Próxima (→)"
          >&#8250;</button>
        </div>
      )}
    </div>
  )
}

export default function NoiteAuthGuard() {
  const [authorized, setAuthorizedState] = useState(() => isAuthorized())
  const navigate = useNavigate()

  useEffect(() => {
    if (authorized) return

    let disposed = false
    const timer = setTimeout(() => {
      const name = window.prompt('Qual é o seu primeiro nome?')
      if (disposed) return
      if (!name || !authorize(name)) {
        window.alert('Acesso negado')
        navigate('/', { replace: true })
        return
      }
      setAuthorized()
      setAuthorizedState(true)
    }, 0)

    return () => {
      disposed = true
      clearTimeout(timer)
    }
  }, [authorized, navigate])

  if (!authorized) return null

  return <NoiteDaRapaziada />
}