import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box, Container, Typography, Paper, Grid, Card, CardContent, CardActionArea,
  CardMedia, Button, Chip, Dialog, DialogTitle, DialogContent, DialogActions,
  IconButton, Stack, Divider, Avatar, Badge, CircularProgress
} from '@mui/material'
import {
  WhatsApp as WhatsAppIcon, CalendarMonth as CalendarIcon, Collections as PhotosIcon,
  Movie as VideoIcon, CheckCircle as CheckIcon, Stars as StarIcon,
  Close as CloseIcon, ArrowBack as PrevIcon, ArrowForward as NextIcon,
  Lock as LockIcon, EventRepeat as RepeatIcon
} from '@mui/icons-material'
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

const WEEKDAY_HEADERS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']

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
    <Paper 
      elevation={4} 
      sx={{ 
        p: 2, 
        backgroundColor: 'rgba(18, 24, 36, 0.85)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(229, 191, 53, 0.2)',
        borderRadius: 3
      }}
    >
      <Typography color="primary.main" fontWeight={700} sx={{ mb: 1.5, fontSize: '1rem', textAlign: 'center' }}>
        {monthLabel}
      </Typography>
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0.5, textAlign: 'center' }}>
        {WEEKDAY_HEADERS.map((h, i) => (
          <Typography key={i} variant="caption" sx={{ color: 'text.secondary', fontWeight: 700 }}>
            {h}
          </Typography>
        ))}
        {cells.map((day, i) => {
          if (day === null) {
            return <Box key={`empty-${i}`} />
          }
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
          const isOccurred = OCCURRED_DATES.has(dateStr)
          const isUpcoming = UPCOMING_DATES.has(dateStr)

          let bg = 'transparent'
          let border = '1px solid rgba(255,255,255,0.05)'
          let textColor = 'text.primary'

          if (isOccurred) {
            bg = 'rgba(16, 185, 129, 0.2)'
            border = '1px solid #10B981'
            textColor = '#10B981'
          } else if (isUpcoming) {
            bg = 'rgba(229, 191, 53, 0.2)'
            border = '1px solid #E5BF35'
            textColor = '#E5BF35'
          }

          return (
            <Box
              key={dateStr}
              sx={{
                py: 0.75,
                borderRadius: 1.5,
                backgroundColor: bg,
                border: border,
                fontWeight: isOccurred || isUpcoming ? 800 : 500,
                fontSize: '0.8rem',
                color: textColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {day}
            </Box>
          )
        })}
      </Box>
    </Paper>
  )
}

function NoiteCalendar() {
  return (
    <Box sx={{ mb: 6 }}>
      <Box sx={{ textAlign: 'center', mb: 3 }}>
        <Typography variant="h5" color="primary.main" fontWeight={800} gutterBottom sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
          <CalendarIcon color="primary" /> Calendário dos Encontros
        </Typography>

        <Stack direction="row" spacing={2} justifyContent="center" sx={{ mt: 1.5 }}>
          <Chip icon={<CheckIcon style={{ color: '#10B981' }} />} label="Realizados" variant="outlined" sx={{ borderColor: '#10B981', color: '#10B981' }} />
          <Chip icon={<StarIcon style={{ color: '#E5BF35' }} />} label="Próximos" variant="outlined" sx={{ borderColor: '#E5BF35', color: '#E5BF35' }} />
        </Stack>
      </Box>

      <Grid container spacing={2}>
        {[6, 7, 8, 9].map(m => (
          <Grid item xs={12} sm={6} md={3} key={m}>
            <CalendarGrid month={m} year={2026} />
          </Grid>
        ))}
      </Grid>
    </Box>
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
    <Paper 
      elevation={6}
      sx={{ 
        overflow: 'hidden', 
        borderRadius: 4, 
        border: '1px solid rgba(229, 191, 53, 0.3)',
        backgroundColor: '#000',
        boxShadow: '0 12px 40px rgba(0,0,0,0.8)'
      }}
    >
      <video
        ref={videoRef}
        style={{ width: '100%', height: 'auto', display: 'block', maxHeight: '420px', objectFit: 'contain' }}
        src={NOITE_VIDEO_URL}
        controls
        autoPlay
        muted
        playsInline
        loop
        preload="auto"
      />
      {playFailed && (
        <Typography variant="caption" sx={{ p: 1, display: 'block', textAlign: 'center', color: 'text.secondary' }}>
          Clique no play para ouvir com som.
        </Typography>
      )}
    </Paper>
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
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Hero Banner Header */}
      <Paper 
        elevation={6}
        sx={{
          p: { xs: 3, md: 5 },
          mb: 5,
          borderRadius: 4,
          background: 'linear-gradient(135deg, rgba(18,24,36,0.95) 0%, rgba(11,14,20,0.98) 100%)',
          border: '1px solid rgba(229,191,53,0.3)',
          boxShadow: '0 16px 48px rgba(0,0,0,0.6)',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <Typography variant="h3" color="primary.main" fontWeight={800} gutterBottom sx={{ letterSpacing: 1.5 }}>
          🌙 Noite da Rapaziada
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" sx={{ maxWidth: 700, mx: 'auto', mb: 3, fontSize: '1.1rem' }}>
          Registros oficiais das nossas reuniões quinzenais para jogos, boas conversas e momentos inesquecíveis.
        </Typography>
        
        <Stack direction="row" spacing={2} justifyContent="center" flexWrap="wrap" useFlexGap sx={{ mt: 2 }}>
          <Button
            variant="contained"
            startIcon={<WhatsAppIcon />}
            href={WHATSAPP_GROUP_URL}
            target="_blank"
            rel="noopener noreferrer"
            sx={{
              background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
              color: '#fff',
              px: 3,
              py: 1.2,
              fontWeight: 800,
              fontSize: '0.95rem',
              boxShadow: '0 4px 20px rgba(37, 211, 102, 0.4)',
              '&:hover': {
                background: 'linear-gradient(135deg, #20bd5a 0%, #0e7065 100%)'
              }
            }}
          >
            Entrar no Grupo do WhatsApp
          </Button>
        </Stack>
      </Paper>

      {/* History and Video Grid */}
      <Grid container spacing={4} sx={{ mb: 6 }}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 4, height: '100%', borderRadius: 4, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <Typography variant="h5" color="primary.main" fontWeight={700} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <RepeatIcon color="primary" /> A História da Tradição
            </Typography>
            <Typography variant="body1" paragraph sx={{ lineHeight: 1.8, color: 'text.primary', mb: 2 }}>
              Em <strong>07/07/2026</strong>, nosso anfitrião <strong>Arthur</strong> propôs institucionalizar encontros frequentes entre os amigos:
            </Typography>
            <Paper 
              elevation={0}
              sx={{
                p: 2.5,
                mb: 2,
                backgroundColor: 'rgba(229, 191, 53, 0.08)',
                borderLeft: '4px solid #E5BF35',
                fontStyle: 'italic'
              }}
            >
              <Typography variant="body1" color="primary.main" fontWeight={600}>
                "Este grupo foi criado para institucionalizar uma noite da semana para acontecer a NOITE DA RAPAZIADA"
              </Typography>
            </Paper>
            <Typography variant="body1" sx={{ lineHeight: 1.8, color: 'text.secondary' }}>
              Desde então, nos reunimos a cada 15 dias para jogar Yu-Gi-Oh!, conversar e celebrar nossa amizade.
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Box>
            <Typography variant="h5" color="primary.main" fontWeight={700} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <VideoIcon color="primary" /> Vídeo da Noite
            </Typography>
            <NoiteVideo />
          </Box>
        </Grid>
      </Grid>

      {/* Calendar Component */}
      <NoiteCalendar />

      {/* Albums Section */}
      <Box sx={{ mb: 6 }}>
        <Typography variant="h4" color="primary.main" fontWeight={800} sx={{ mb: 3, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
          <PhotosIcon color="primary" fontSize="large" /> Álbuns por Data
        </Typography>

        <Grid container spacing={3}>
          {Object.entries(ALBUM_DATA).map(([date, album]) => {
            const albumPreview = previews[date] || []
            const coverImage = album.cover || albumPreview[0]

            return (
              <Grid item xs={12} sm={6} md={4} key={date}>
                <Card 
                  sx={{ 
                    borderRadius: 4,
                    transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                    border: '1px solid rgba(229,191,53,0.25)',
                    '&:hover': {
                      transform: 'translateY(-6px)',
                      boxShadow: '0 12px 32px rgba(229,191,53,0.3)',
                      borderColor: '#E5BF35'
                    }
                  }}
                >
                  <CardActionArea onClick={() => openAlbum(date)}>
                    <Box sx={{ position: 'relative', height: 220, backgroundColor: '#000' }}>
                      {coverImage ? (
                        <CardMedia
                          component="img"
                          height="220"
                          image={coverImage}
                          alt={album.title}
                          sx={{ objectFit: 'cover' }}
                        />
                      ) : (
                        <Box sx={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
                          <PhotosIcon sx={{ fontSize: 60, color: 'text.secondary' }} />
                        </Box>
                      )}
                      
                      <Chip
                        label={`${album.photos} FOTOS`}
                        color="primary"
                        size="small"
                        sx={{
                          position: 'absolute',
                          top: 12,
                          right: 12,
                          fontWeight: 800,
                          boxShadow: '0 4px 12px rgba(0,0,0,0.6)'
                        }}
                      />

                      <Chip
                        label={date}
                        size="small"
                        sx={{
                          position: 'absolute',
                          bottom: 12,
                          left: 12,
                          backgroundColor: 'rgba(11,14,20,0.85)',
                          color: '#fff',
                          fontWeight: 700,
                          backdropFilter: 'blur(8px)'
                        }}
                      />
                    </Box>

                    <CardContent sx={{ p: 2.5 }}>
                      <Typography variant="h6" color="primary.main" fontWeight={700} gutterBottom noWrap>
                        {album.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ minHeight: 40 }}>
                        {album.description}
                      </Typography>
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>
            )
          })}
        </Grid>
      </Box>

      {/* Album Photos Dialog Modal */}
      <Dialog
        open={Boolean(showAlbum)}
        onClose={closeAlbum}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" color="primary.main" fontWeight={700}>
            {ALBUM_DATA[showAlbum]?.title || showAlbum}
          </Typography>
          <IconButton onClick={closeAlbum} color="primary">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
              <CircularProgress color="primary" />
            </Box>
          ) : albumPhotos.length === 0 ? (
            <Typography variant="body1" textAlign="center" color="text.secondary" sx={{ p: 4 }}>
              Nenhuma foto encontrada neste álbum.
            </Typography>
          ) : (
            <Grid container spacing={2}>
              {albumPhotos.map((photo, index) => (
                <Grid item xs={6} sm={4} md={3} key={index}>
                  <Card 
                    sx={{ 
                      borderRadius: 3, 
                      cursor: 'pointer',
                      border: '1px solid rgba(229,191,53,0.2)',
                      '&:hover': { opacity: 0.9, borderColor: '#E5BF35' }
                    }}
                    onClick={() => setViewPhotoIndex(index)}
                  >
                    <CardMedia
                      component="img"
                      height="160"
                      image={photo}
                      alt={`Foto ${index + 1}`}
                      sx={{ objectFit: 'cover' }}
                      loading="lazy"
                    />
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button variant="outlined" color="primary" onClick={closeAlbum}>
            Fechar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Lightbox / Fullscreen Image Viewer Modal */}
      <Dialog
        open={viewPhotoIndex !== null}
        onClose={() => setViewPhotoIndex(null)}
        maxWidth="xl"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: 'rgba(5, 7, 10, 0.95)',
            backdropFilter: 'blur(20px)',
            border: 'none',
            boxShadow: 'none'
          }
        }}
      >
        {viewPhotoIndex !== null && albumPhotos[viewPhotoIndex] && (
          <Box sx={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', p: 2, minHeight: '80vh' }}>
            <IconButton
              onClick={() => setViewPhotoIndex(null)}
              sx={{ position: 'absolute', top: 16, right: 16, color: '#fff', backgroundColor: 'rgba(0,0,0,0.5)' }}
            >
              <CloseIcon />
            </IconButton>

            <IconButton
              onClick={showPrevPhoto}
              sx={{ position: 'absolute', left: 16, color: '#E5BF35', backgroundColor: 'rgba(0,0,0,0.6)', p: 1.5 }}
            >
              <PrevIcon fontSize="large" />
            </IconButton>

            <Box
              component="img"
              src={albumPhotos[viewPhotoIndex]}
              alt={`Foto ${viewPhotoIndex + 1}`}
              sx={{
                maxWidth: '90vw',
                maxHeight: '75vh',
                objectFit: 'contain',
                borderRadius: 3,
                boxShadow: '0 0 40px rgba(0,0,0,0.9)',
                border: '2px solid rgba(229,191,53,0.4)'
              }}
            />

            <IconButton
              onClick={showNextPhoto}
              sx={{ position: 'absolute', right: 16, color: '#E5BF35', backgroundColor: 'rgba(0,0,0,0.6)', p: 1.5 }}
            >
              <NextIcon fontSize="large" />
            </IconButton>

            <Typography variant="body2" sx={{ mt: 2, color: 'primary.main', fontWeight: 700 }}>
              {viewPhotoIndex + 1} / {albumPhotos.length}
            </Typography>
          </Box>
        )}
      </Dialog>
    </Container>
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