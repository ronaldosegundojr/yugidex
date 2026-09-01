import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './NoiteDaRapaziada.css'

const ALLOWED_NAMES = [
  'yan', 'ronaldo', 'ju', 'bia', 'bianca', 'arthur', 'guto', 'gustavo',
  'luiz gustavo', 'pietro', 'spider', 'peterson', 'vinicius', 'bruna',
  'cirineu', 'maira', 'yugi', 'kaiba'
]

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
  }
}

function NoiteDaRapaziada() {
  const [authenticated, setAuthenticated] = useState(false)
  const [showAlbum, setShowAlbum] = useState(null)
  const [albumPhotos, setAlbumPhotos] = useState([])
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const handleAuth = () => {
      const name = prompt('Qual é o seu primeiro nome?')
      if (!name) {
        alert('Acesso negado')
        navigate('/')
        return
      }
      
      const normalizedName = name.toLowerCase().trim()
      const isAllowed = ALLOWED_NAMES.some(allowed => 
        allowed.toLowerCase() === normalizedName
      )
      
      if (isAllowed) {
        setAuthenticated(true)
      } else {
        alert('Acesso negado')
        navigate('/')
      }
    }
    
    handleAuth()
  }, [navigate])

  const loadAlbumPhotos = async (date) => {
    setLoading(true)
    try {
      const response = await fetch(`/fotos-noite-rapaziada/${date}/manifest.json`)
      if (response.ok) {
        const data = await response.json()
        setAlbumPhotos(data.photos || [])
      } else {
        const files = ALBUM_DATA[date]?.photos || 0
        const photos = []
        for (let i = 1; i <= files; i++) {
          photos.push(`/fotos-noite-rapaziada/${date}/WhatsApp Image 2026-07-13 at 23.09.09 (${i}).jpeg`)
        }
        setAlbumPhotos(photos)
      }
    } catch (error) {
      console.error('Erro ao carregar fotos:', error)
      setAlbumPhotos([])
    } finally {
      setLoading(false)
    }
  }

  const openAlbum = (date) => {
    setShowAlbum(date)
    loadAlbumPhotos(date)
  }

  const closeAlbum = () => {
    setShowAlbum(null)
    setAlbumPhotos([])
  }

  if (!authenticated) {
    return null
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
        </div>
      </div>

      <div className="albums-section">
        <h2>📸 Álbuns por Data</h2>
        <div className="albums-grid">
          {Object.entries(ALBUM_DATA).map(([date, album]) => (
            <div 
              key={date} 
              className="album-card"
              onClick={() => openAlbum(date)}
            >
              <div className="album-cover">
                <span className="album-date">{date}</span>
                <span className="album-photo-count">{album.photos} fotos</span>
              </div>
              <div className="album-info">
                <h3>{album.title}</h3>
                <p>{album.description}</p>
              </div>
            </div>
          ))}
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
                  <div key={index} className="album-photo-item">
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
    </div>
  )
}

export default NoiteDaRapaziada