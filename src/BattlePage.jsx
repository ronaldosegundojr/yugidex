import { useState, useRef, useCallback, useEffect } from 'react'
import './BattlePage.css'

const SOUND_MAP = {
  'point-drop': '/sounds/point-drop.mp3',
  'mamaco': '/sounds/eu-vim-ver-o-mamaco.mp3',
  'hora-do-duelo': '/sounds/yu-gi-oh-e-hora-do-duelo.mp3',
  'life-points': '/sounds/yugioh-life-points.mp3',
  'oh-no-oh-yes': '/sounds/yugioh-oh-no-oh-yes.mp3',
  'sua-vez': '/sounds/sua-vez.mp3',
  'meme': '/sounds/yugioh-meme.mp3',
  'time-to-duel': '/sounds/Its-time-to-duel.mp3',
  'baixar-carta': '/sounds/yugioh-baixar-carta.mp3',
}

const SOUND_BUTTONS = [
  { key: 'mamaco', label: 'Eu vim ver o macaco', icon: '🐒' },
  { key: 'hora-do-duelo', label: 'É hora do duelo', icon: '⚔️' },
  { key: 'life-points', label: 'Pontos de vida', icon: '❤️' },
  { key: 'oh-no-oh-yes', label: 'Oh no, oh yes', icon: '😱' },
  { key: 'sua-vez', label: 'Sua Vez', icon: '👉' },
  { key: 'meme', label: 'Yugioh Meme', icon: '😂' },
  { key: 'time-to-duel', label: "It's time to duel", icon: '🃏' },
  { key: 'baixar-carta', label: 'Baixar Carta', icon: '📥' },
]

const MUSIC_TRACKS = [
  { name: 'Yu-Gi-Oh! Abertura', src: '/music/Abertura Yu Gi Oh (Versão Brasileira) - Malungados (youtube).mp3' },
  { name: 'Forbidden Memories - Main Menu', src: '/music/01 - Yu-Gi-Oh! Forbidden Memories OST - Main Menu (Remastered).mp3' },
  { name: 'Forbidden Memories - Egyptian Duel', src: '/music/05 - Yu-Gi-Oh! Forbidden Memories OST - Egyptian Duel (Remastered).mp3' },
  { name: 'Forbidden Memories - Free Duel', src: '/music/48 - Yu-Gi-Oh! Forbidden Memories OST - Free Duel (Remastered).mp3' },
  { name: 'Forbidden Memories - Build Deck', src: '/music/47 - Yu-Gi-Oh! Forbidden Memories OST - Build Deck (Remastered).mp3' },
  { name: 'Forbidden Memories - 3D Duel', src: '/music/06 - Yu-Gi-Oh! Forbidden Memories OST - 3D Duel Egypt (Remastered).mp3' },
  { name: 'Forbidden Memories - Card Shop', src: '/music/14 - Yu-Gi-Oh! Forbidden Memories OST - Card Shop (Modern Times) (Remastered).mp3' },
]

const VALUE_OPTIONS = [10, 50, 100, 500, 1000]
const DEFAULT_LP = 8000

const TEMPLATES = [
  { id: 'vortex', name: 'Vórtex Clássico (Anime)', fontClass: 'style-classic', bgGradient: 'radial-gradient(circle at center, rgba(10,20,50,0.8), rgba(0,0,15,0.95)), url("/battle_bg_seamless.jpg")', color: '#d6ca00' },
  { id: 'anime-purple', name: 'Placar Anime Roxo (Kaiba / Yugi)', fontClass: 'style-purple-box', bgGradient: 'linear-gradient(135deg, #090a18 0%, #151833 50%, #05060d 100%)', color: '#e056fd' },
  { id: 'dual-gauge', name: 'Medidor Duelo Sci-Fi (Barra de LP)', fontClass: 'style-gauge', bgGradient: 'radial-gradient(ellipse at center, #1b263b 0%, #0d1b2a 100%)', color: '#ffea00' },
  { id: 'circular-gauge', name: 'Relógio Duelo Redondo (4000 LP)', fontClass: 'style-circular', bgGradient: 'linear-gradient(180deg, #1c1c1c 0%, #080808 100%)', color: '#e6e6e6' },
  { id: 'rainbow-disc', name: 'Disco Rainbow LP (Duelo Clássico)', fontClass: 'style-rainbow', bgGradient: 'radial-gradient(circle at center, #2b2d42 0%, #11121e 100%)', color: '#ffffff' },
]

const globalAudioMap = {}
if (typeof window !== 'undefined') {
  Object.entries(SOUND_MAP).forEach(([key, src]) => {
    const audio = new Audio(src)
    audio.preload = 'auto'
    globalAudioMap[key] = audio
  })
}

function playSoundInstant(key) {
  const audio = globalAudioMap[key]
  if (audio) {
    audio.currentTime = 0
    audio.play().catch(() => {})
  } else {
    const newAudio = new Audio(SOUND_MAP[key])
    newAudio.play().catch(() => {})
  }
}

function LPChangeIndicator({ change }) {
  if (!change) return null
  const isPositive = change.value > 0
  return (
    <span className={`lp-change-indicator ${isPositive ? 'positive' : 'negative'}`} key={change.id}>
      {isPositive ? '+' : ''}{change.value}
    </span>
  )
}

function LPDisplay({ lp, animClass, change, label, currentTemplate }) {
  const templateId = currentTemplate.id

  if (templateId === 'anime-purple') {
    return (
      <div className="lp-display-container">
        <div className="anime-purple-scoreboard">
          <div className="anime-purple-header">{label || 'YUGI'}</div>
          <div className={`anime-purple-digits ${animClass}`}>
            {Math.max(0, lp).toString().padStart(4, '0')}
          </div>
        </div>
        <LPChangeIndicator change={change} />
      </div>
    )
  }

  if (templateId === 'dual-gauge') {
    const percentage = Math.min(100, Math.max(0, (lp / 8000) * 100))
    return (
      <div className="lp-display-container">
        <div className="dual-gauge-box">
          <div className="dual-gauge-bar-wrapper">
            <div className="dual-gauge-bar-fill" style={{ height: `${percentage}%` }} />
          </div>
          <div className="dual-gauge-screen">
            <div className={`dual-gauge-number ${animClass}`}>
              {Math.max(0, lp)}
            </div>
          </div>
        </div>
        <LPChangeIndicator change={change} />
      </div>
    )
  }

  if (templateId === 'circular-gauge') {
    return (
      <div className="lp-display-container">
        <div className="circular-gauge-disc">
          <div className={`circular-gauge-number ${animClass}`}>
            {Math.max(0, lp)}
          </div>
        </div>
        <LPChangeIndicator change={change} />
      </div>
    )
  }

  if (templateId === 'rainbow-disc') {
    return (
      <div className="lp-display-container">
        <div className="rainbow-disc-box">
          <div className="rainbow-disc-label">LP</div>
          <div className={`rainbow-disc-number ${animClass}`}>
            {Math.max(0, lp)}
          </div>
        </div>
        <LPChangeIndicator change={change} />
      </div>
    )
  }

  return (
    <div className="lp-display-container">
      {label && <div className="lp-player-label">{label}</div>}
      <div className={`lp-number-yugioh ${currentTemplate.fontClass} ${animClass}`} style={{ color: currentTemplate.color }}>
        {Math.max(0, lp)}
      </div>
      <LPChangeIndicator change={change} />
    </div>
  )
}

function LPControls({ selectedValue, setSelectedValue, onAdd, onSubtract, onCustom }) {
  return (
    <div className="lp-controls-bar">
      <button className="ygo-hex-btn calc-btn" onClick={onCustom} title="Calculadora de Duelo">
        🧮
      </button>
      {VALUE_OPTIONS.map(val => (
        <button
          key={val}
          className={`ygo-hex-btn val-btn ${selectedValue === val ? 'selected' : ''}`}
          onClick={() => setSelectedValue(val)}
        >
          {val}
        </button>
      ))}
      <button className="ygo-circle-btn plus-btn" onClick={onAdd}>＋</button>
      <button className="ygo-circle-btn minus-btn" onClick={onSubtract}>−</button>
    </div>
  )
}

function SideAudioPlayer({ onClose }) {
  const [trackIndex, setTrackIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLooping, setIsLooping] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const audioRef = useRef(null)

  const currentTrack = MUSIC_TRACKS[trackIndex]

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = 0.5
      audioRef.current.loop = isLooping
      if (isPlaying) {
        audioRef.current.play().catch(() => {})
      }
    }
  }, [trackIndex, isLooping])

  const togglePlay = () => {
    if (!audioRef.current) return
    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {})
    }
  }

  const toggleLoop = () => {
    setIsLooping(prev => !prev)
  }

  const nextTrack = () => {
    setTrackIndex((prev) => (prev + 1) % MUSIC_TRACKS.length)
  }

  const prevTrack = () => {
    setTrackIndex((prev) => (prev - 1 + MUSIC_TRACKS.length) % MUSIC_TRACKS.length)
  }

  return (
    <div className={`side-audio-player ${isMinimized ? 'minimized' : ''}`}>
      <audio
        ref={audioRef}
        src={currentTrack.src}
        onEnded={() => {
          if (!isLooping) nextTrack()
        }}
      />
      <div className="player-header">
        <span className="player-title">🎵 Trilha Sonora Duelo</span>
        <div className="player-actions">
          <button onClick={() => setIsMinimized(!isMinimized)}>{isMinimized ? '📖' : '➖'}</button>
          <button onClick={onClose}>&times;</button>
        </div>
      </div>

      {!isMinimized && (
        <div className="player-body">
          <div className="track-name">{currentTrack.name}</div>
          <div className="player-controls">
            <button onClick={prevTrack}>⏮️</button>
            <button className="play-pause-btn" onClick={togglePlay}>
              {isPlaying ? '⏸️ Pausar' : '▶️ Tocar'}
            </button>
            <button onClick={nextTrack}>⏭️</button>
            <button 
              className={`loop-btn ${isLooping ? 'active' : ''}`} 
              onClick={toggleLoop}
              title={isLooping ? 'Loop Ativado' : 'Loop Desativado'}
            >
              🔁
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function DesignModal({ currentTemplate, setTemplate, onClose }) {
  return (
    <div className="ygo-calc-overlay" onClick={onClose}>
      <div className="ygo-design-modal" onClick={e => e.stopPropagation()}>
        <div className="sound-panel-header">
          <h3>🎨 Modelos do Placar & Background</h3>
          <button className="sound-panel-close" onClick={onClose}>&times;</button>
        </div>
        <p className="design-subtitle">Selecione o modelo do anime clássico ou sci-fi:</p>
        <div className="design-grid">
          {TEMPLATES.map(t => (
            <div
              key={t.id}
              className={`design-card ${currentTemplate.id === t.id ? 'active' : ''}`}
              onClick={() => { setTemplate(t); playSoundInstant('point-drop'); }}
            >
              <div className="design-preview-box" style={{ background: t.bgGradient }}>
                <span className={`design-preview-text ${t.fontClass}`} style={{ color: t.color }}>
                  8000
                </span>
              </div>
              <span className="design-card-name">{t.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function HistoryModal({ history, onClose }) {
  return (
    <div className="ygo-calc-overlay" onClick={onClose}>
      <div className="ygo-history-modal" onClick={e => e.stopPropagation()}>
        <div className="sound-panel-header">
          <h3>📖 Histórico do Duelo</h3>
          <button className="sound-panel-close" onClick={onClose}>&times;</button>
        </div>
        <div className="history-list">
          {history.length === 0 ? (
            <p className="empty-history">Nenhuma alteração de LP registrada ainda.</p>
          ) : (
            history.map((item, idx) => (
              <div key={idx} className="history-item">
                <span className="history-index">#{idx + 1}</span>
                <span className={`history-val ${item.change > 0 ? 'pos' : 'neg'}`}>
                  {item.change > 0 ? `+${item.change}` : item.change} LP
                </span>
                <span className="history-result">Total: {item.resultLp}</span>
                <span className="history-time">{item.time}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

function SettingsModal({ lpInitial, setLpInitial, player1, player2, onClose }) {
  const [val, setVal] = useState(lpInitial)

  const handleApply = (newDefault) => {
    setLpInitial(newDefault)
    player1.setLp(newDefault)
    if (player2) player2.setLp(newDefault)
    playSoundInstant('point-drop')
    onClose()
  }

  return (
    <div className="ygo-calc-overlay" onClick={onClose}>
      <div className="ygo-history-modal" onClick={e => e.stopPropagation()}>
        <div className="sound-panel-header">
          <h3>⚙️ Configurações de Duelo</h3>
          <button className="sound-panel-close" onClick={onClose}>&times;</button>
        </div>
        <div className="settings-body">
          <label>Pontos de Vida Iniciais Padrão:</label>
          <div className="settings-lp-presets">
            {[8000, 4000, 10000, 16000].map(preset => (
              <button
                key={preset}
                className={`preset-btn ${val === preset ? 'active' : ''}`}
                onClick={() => setVal(preset)}
              >
                {preset} LP
              </button>
            ))}
          </div>
          <button className="settings-apply-btn" onClick={() => handleApply(val)}>
            Aplicar Novo Valor Inicial
          </button>
        </div>
      </div>
    </div>
  )
}

function YuGiOhCalculatorModal({ currentLp, setLp, triggerChange, onClose }) {
  const [inputValue, setInputValue] = useState('')
  const [operator, setOperator] = useState(null)

  const handleDigit = (digit) => {
    if (inputValue.length >= 7) return
    setInputValue(prev => prev + digit)
  }

  const handleBackspace = () => setInputValue(prev => prev.slice(0, -1))
  const handleClear = () => { setInputValue(''); setOperator(null); }

  const handleDivideByTwo = () => {
    const half = Math.floor(currentLp / 2)
    const diff = currentLp - half
    setLp(half)
    triggerChange(-diff)
    onClose()
  }

  const handleMultiplyByTwo = () => {
    const double = currentLp * 2
    const diff = double - currentLp
    setLp(double)
    triggerChange(diff)
    onClose()
  }

  const handleOperatorSelect = (op) => setOperator(op)

  const handleEquals = () => {
    const num = parseInt(inputValue, 10)
    if (operator === '+') {
      const val = isNaN(num) ? 0 : num
      setLp(prev => prev + val)
      triggerChange(val)
    } else if (operator === '-') {
      const val = isNaN(num) ? 0 : num
      setLp(prev => Math.max(0, prev - val))
      triggerChange(-val)
    } else if (inputValue !== '') {
      const val = parseInt(inputValue, 10)
      setLp(prev => Math.max(0, prev - val))
      triggerChange(-val)
    }
    onClose()
  }

  return (
    <div className="ygo-calc-overlay" onClick={onClose}>
      <div className="ygo-calc-keypad" onClick={e => e.stopPropagation()}>
        <div className="ygo-calc-display-row">
          <div className="ygo-calc-lp-box">{currentLp}</div>
          <div className="ygo-calc-input-box">
            {operator && <span className="ygo-calc-op-symbol">{operator}</span>}
            <span className="ygo-calc-input-text">{inputValue}</span>
          </div>
          <button className="ygo-calc-close-btn" onClick={onClose}>&times;</button>
        </div>

        <div className="ygo-calc-body">
          <div className="ygo-calc-left-grid">
            <button className="ygo-calc-btn btn-action" onClick={handleClear}>LIMPAR</button>
            <button className="ygo-calc-btn btn-action" onClick={handleBackspace}>⌫</button>

            <button className="ygo-calc-btn btn-num" onClick={() => handleDigit('7')}>7</button>
            <button className="ygo-calc-btn btn-num" onClick={() => handleDigit('8')}>8</button>
            <button className="ygo-calc-btn btn-num" onClick={() => handleDigit('9')}>9</button>

            <button className="ygo-calc-btn btn-num" onClick={() => handleDigit('4')}>4</button>
            <button className="ygo-calc-btn btn-num" onClick={() => handleDigit('5')}>5</button>
            <button className="ygo-calc-btn btn-num" onClick={() => handleDigit('6')}>6</button>

            <button className="ygo-calc-btn btn-num" onClick={() => handleDigit('1')}>1</button>
            <button className="ygo-calc-btn btn-num" onClick={() => handleDigit('2')}>2</button>
            <button className="ygo-calc-btn btn-num" onClick={() => handleDigit('3')}>3</button>

            <button className="ygo-calc-btn btn-num" onClick={() => handleDigit('0')}>0</button>
            <button className="ygo-calc-btn btn-num" onClick={() => handleDigit('00')}>00</button>
            <button className="ygo-calc-btn btn-num" onClick={() => handleDigit('000')}>000</button>
          </div>

          <div className="ygo-calc-right-column">
            <button className="ygo-calc-btn btn-yellow" onClick={handleDivideByTwo}>÷2</button>
            <button className="ygo-calc-btn btn-yellow" onClick={handleMultiplyByTwo}>&times;2</button>
            <button className={`ygo-calc-btn btn-yellow ${operator === '-' ? 'selected' : ''}`} onClick={() => handleOperatorSelect('-')}>−</button>
            <button className={`ygo-calc-btn btn-yellow ${operator === '+' ? 'selected' : ''}`} onClick={() => handleOperatorSelect('+')}>＋</button>
            <button className="ygo-calc-btn btn-equals" onClick={handleEquals}>=</button>
          </div>
        </div>
      </div>
    </div>
  )
}

function DiceCoinModal({ onClose }) {
  const [activeTab, setActiveTab] = useState('dice')
  const [isRolling, setIsRolling] = useState(false)
  const [diceResult, setDiceResult] = useState(1)
  const [diceRotation, setDiceRotation] = useState({ x: 0, y: 0 })
  
  const [coinChoice, setCoinChoice] = useState(null)
  const [coinResult, setCoinResult] = useState(null)
  const [coinRotation, setCoinRotation] = useState(0)

  const rollDice = () => {
    if (isRolling) return
    setIsRolling(true)
    playSoundInstant('baixar-carta')
    const finalVal = Math.floor(Math.random() * 6) + 1
    
    const rotations = {
      1: { x: 0, y: 0 }, 2: { x: 0, y: 180 }, 3: { x: 0, y: -90 },
      4: { x: 0, y: 90 }, 5: { x: -90, y: 0 }, 6: { x: 90, y: 0 }
    }
    const extraSpins = 1440
    const target = rotations[finalVal]
    setDiceRotation({ x: target.x + extraSpins, y: target.y + extraSpins })

    setTimeout(() => { setDiceResult(finalVal); setIsRolling(false); }, 1200)
  }

  const flipCoin = (choice) => {
    if (isRolling) return
    setCoinChoice(choice)
    setIsRolling(true)
    setCoinResult(null)
    playSoundInstant('baixar-carta')

    const isHeads = Math.random() < 0.5
    const res = isHeads ? 'cara' : 'coroa'
    const extraFlips = 1800
    const targetRot = isHeads ? extraFlips : extraFlips + 180

    setCoinRotation(targetRot)
    setTimeout(() => { setCoinResult(res); setIsRolling(false); }, 1400)
  }

  return (
    <div className="modal-3d-overlay" onClick={onClose}>
      <div className="modal-3d-content" onClick={e => e.stopPropagation()}>
        <div className="modal-3d-header">
          <div className="modal-3d-tabs">
            <button className={`modal-tab ${activeTab === 'dice' ? 'active' : ''}`} onClick={() => setActiveTab('dice')}>🎲 Dado (1-6)</button>
            <button className={`modal-tab ${activeTab === 'coin' ? 'active' : ''}`} onClick={() => setActiveTab('coin')}>🪙 Moeda</button>
          </div>
          <button className="sound-panel-close" onClick={onClose}>&times;</button>
        </div>

        {activeTab === 'dice' ? (
          <div className="dice-container">
            <div className="dice-stage">
              <div className="cube-3d" style={{ transform: `rotateX(${diceRotation.x}deg) rotateY(${diceRotation.y}deg)` }}>
                <div className="cube-face face-1">1</div><div className="cube-face face-2">2</div>
                <div className="cube-face face-3">3</div><div className="cube-face face-4">4</div>
                <div className="cube-face face-5">5</div><div className="cube-face face-6">6</div>
              </div>
            </div>
            <button className="roll-btn" disabled={isRolling} onClick={rollDice}>
              {isRolling ? 'Rolar Dado...' : '🎲 Rolar Dado'}
            </button>
            {!isRolling && diceResult && <div className="result-text">Resultado: <span>{diceResult}</span></div>}
          </div>
        ) : (
          <div className="coin-container">
            {!coinChoice && !coinResult ? (
              <div className="coin-choice-prompt">
                <p>Escolha o seu palpite:</p>
                <div className="coin-choice-btns">
                  <button onClick={() => flipCoin('cara')}>👑 Cara</button>
                  <button onClick={() => flipCoin('coroa')}>🛡️ Coroa</button>
                </div>
              </div>
            ) : (
              <>
                <div className="coin-stage">
                  <div className="coin-3d" style={{ transform: `rotateY(${coinRotation}deg)` }}>
                    <div className="coin-face coin-heads">👑 CARA</div>
                    <div className="coin-face coin-tails">🛡️ COROA</div>
                  </div>
                </div>
                {!isRolling && coinResult && (
                  <div className="coin-result-box">
                    <p>Deu <strong>{coinResult.toUpperCase()}</strong>!</p>
                    <p className={coinChoice === coinResult ? 'win' : 'lose'}>
                      {coinChoice === coinResult ? '🎉 Você acertou!' : '❌ Você errou!'}
                    </p>
                    <button className="retry-btn" onClick={() => { setCoinChoice(null); setCoinResult(null); }}>Jogar Novamente</button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function SoundPanel({ onClose }) {
  const [playingKey, setPlayingKey] = useState(null)

  const handlePlay = (key) => {
    setPlayingKey(key)
    playSoundInstant(key)
    setTimeout(() => setPlayingKey(null), 1500)
  }

  return (
    <>
      <div className="sound-panel-overlay" onClick={onClose} />
      <div className="sound-panel">
        <div className="sound-panel-header">
          <h3>🔊 Efeitos Sonoros Duelo</h3>
          <button className="sound-panel-close" onClick={onClose}>&times;</button>
        </div>
        <div className="sound-grid">
          {SOUND_BUTTONS.map(({ key, label, icon }) => (
            <button
              key={key}
              className={`sound-btn ${playingKey === key ? 'playing' : ''}`}
              onClick={() => handlePlay(key)}
            >
              <span className="sound-btn-icon">{icon}</span>
              {label}
            </button>
          ))}
        </div>
      </div>
    </>
  )
}

function usePlayerState(initialLp) {
  const [lp, setLp] = useState(initialLp)
  const [selectedValue, setSelectedValue] = useState(100)
  const [animClass, setAnimClass] = useState('')
  const [change, setChange] = useState(null)
  const [showCustom, setShowCustom] = useState(false)
  const [history, setHistory] = useState([])
  const changeIdRef = useRef(0)

  useEffect(() => { setLp(initialLp); }, [initialLp])

  const triggerChange = useCallback((amount) => {
    if (amount === 0) return
    const cls = amount > 0 ? 'lp-animating-up' : 'lp-animating-down'
    setAnimClass(cls)
    changeIdRef.current += 1
    setChange({ value: amount, id: changeIdRef.current })
    playSoundInstant('point-drop')

    setLp(curr => {
      setHistory(h => [...h, {
        change: amount,
        resultLp: curr,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      }])
      return curr
    })

    setTimeout(() => setAnimClass(''), 300)
  }, [])

  const add = useCallback((val) => {
    const v = val || selectedValue
    setLp(prev => prev + v)
    triggerChange(v)
  }, [selectedValue, triggerChange])

  const subtract = useCallback((val) => {
    const v = val || selectedValue
    setLp(prev => Math.max(0, prev - v))
    triggerChange(-v)
  }, [selectedValue, triggerChange])

  const reset = useCallback(() => {
    setLp(initialLp)
    setAnimClass('')
    setChange(null)
    setHistory([])
    playSoundInstant('point-drop')
  }, [initialLp])

  return {
    lp, setLp, selectedValue, setSelectedValue, animClass, change, history,
    add, subtract, reset, showCustom, setShowCustom, triggerChange
  }
}

function SinglePlayerBattle({ onBack, currentTemplate, setTemplate }) {
  const [lpInitial, setLpInitial] = useState(DEFAULT_LP)
  const player = usePlayerState(lpInitial)
  const [soundOpen, setSoundOpen] = useState(false)
  const [diceCoinOpen, setDiceCoinOpen] = useState(false)
  const [designOpen, setDesignOpen] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [musicPlayerOpen, setMusicPlayerOpen] = useState(true)

  return (
    <div className="battle-arena" style={{ background: currentTemplate.bgGradient }}>
      <div className="ygo-header-bar">
        <button className="ygo-nav-hex" onClick={onBack} title="Voltar">↩</button>
        <button className="ygo-nav-hex" onClick={() => setSoundOpen(true)} title="Sons">🎵</button>
        <button className="ygo-nav-hex" onClick={() => setDesignOpen(true)} title="Design & Modelos">🎨</button>

        <button className="ygo-nav-hex center-hex" onClick={() => setDiceCoinOpen(true)} title="Dado & Moeda">🎲🪙</button>

        <button className="ygo-nav-hex" onClick={player.reset} title="Resetar LP">⟲</button>
        <button className="ygo-nav-hex" onClick={() => setHistoryOpen(true)} title="Histórico">📖</button>
        <button className="ygo-nav-hex" onClick={() => setSettingsOpen(true)} title="Configurações">⚙️</button>
      </div>

      <div className="single-player-wrapper">
        <LPDisplay
          lp={player.lp}
          animClass={player.animClass}
          change={player.change}
          currentTemplate={currentTemplate}
        />

        {/* Componente Intermediário de Espaçamento Ideal */}
        <div className="lp-controls-spacer" />

        <LPControls
          selectedValue={player.selectedValue}
          setSelectedValue={player.setSelectedValue}
          onAdd={() => player.add()}
          onSubtract={() => player.subtract()}
          onReset={player.reset}
          onCustom={() => player.setShowCustom(true)}
        />
      </div>

      {musicPlayerOpen && <SideAudioPlayer onClose={() => setMusicPlayerOpen(false)} />}
      {player.showCustom && (
        <YuGiOhCalculatorModal
          currentLp={player.lp}
          setLp={player.setLp}
          triggerChange={player.triggerChange}
          onClose={() => player.setShowCustom(false)}
        />
      )}

      {soundOpen && <SoundPanel onClose={() => setSoundOpen(false)} />}
      {diceCoinOpen && <DiceCoinModal onClose={() => setDiceCoinOpen(false)} />}
      {designOpen && <DesignModal currentTemplate={currentTemplate} setTemplate={setTemplate} onClose={() => setDesignOpen(false)} />}
      {historyOpen && <HistoryModal history={player.history} onClose={() => setHistoryOpen(false)} />}
      {settingsOpen && <SettingsModal lpInitial={lpInitial} setLpInitial={setLpInitial} player1={player} onClose={() => setSettingsOpen(false)} />}
    </div>
  )
}

function DuoPlayerBattle({ onBack, currentTemplate, setTemplate }) {
  const [lpInitial, setLpInitial] = useState(DEFAULT_LP)
  const player1 = usePlayerState(lpInitial)
  const player2 = usePlayerState(lpInitial)
  const [soundOpen, setSoundOpen] = useState(false)
  const [diceCoinOpen, setDiceCoinOpen] = useState(false)
  const [designOpen, setDesignOpen] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [musicPlayerOpen, setMusicPlayerOpen] = useState(true)

  return (
    <div className="battle-arena" style={{ background: currentTemplate.bgGradient }}>
      <div className="duo-center-floating-bar">
        <button className="ygo-nav-hex" onClick={onBack} title="Voltar">↩</button>
        <button className="ygo-nav-hex" onClick={() => setSoundOpen(true)} title="Sons">🎵</button>
        <button className="ygo-nav-hex" onClick={() => setDesignOpen(true)} title="Design">🎨</button>
        <button className="ygo-nav-hex center-hex" onClick={() => setDiceCoinOpen(true)} title="Dado & Moeda">🎲🪙</button>
        <button className="ygo-nav-hex" onClick={() => { player1.reset(); player2.reset(); }} title="Resetar">⟲</button>
        <button className="ygo-nav-hex" onClick={() => setHistoryOpen(true)} title="Histórico">📖</button>
        <button className="ygo-nav-hex" onClick={() => setSettingsOpen(true)} title="Configurações">⚙️</button>
      </div>

      <div className="battle-duo-layout">
        <div className="battle-duo-side player-top">
          <LPDisplay
            lp={player1.lp}
            animClass={player1.animClass}
            change={player1.change}
            label="P1"
            currentTemplate={currentTemplate}
          />
          <div className="lp-controls-spacer-duo" />
          <LPControls
            selectedValue={player1.selectedValue}
            setSelectedValue={player1.setSelectedValue}
            onAdd={() => player1.add()}
            onSubtract={() => player1.subtract()}
            onReset={player1.reset}
            onCustom={() => player1.setShowCustom(true)}
          />
          {player1.showCustom && (
            <YuGiOhCalculatorModal
              currentLp={player1.lp}
              setLp={player1.setLp}
              triggerChange={player1.triggerChange}
              onClose={() => player1.setShowCustom(false)}
            />
          )}
        </div>

        <div className="battle-duo-separator" />

        <div className="battle-duo-side player-bottom">
          <LPDisplay
            lp={player2.lp}
            animClass={player2.animClass}
            change={player2.change}
            label="P2"
            currentTemplate={currentTemplate}
          />
          <div className="lp-controls-spacer-duo" />
          <LPControls
            selectedValue={player2.selectedValue}
            setSelectedValue={player2.setSelectedValue}
            onAdd={() => player2.add()}
            onSubtract={() => player2.subtract()}
            onReset={player2.reset}
            onCustom={() => player2.setShowCustom(true)}
          />
          {player2.showCustom && (
            <YuGiOhCalculatorModal
              currentLp={player2.lp}
              setLp={player2.setLp}
              triggerChange={player2.triggerChange}
              onClose={() => player2.setShowCustom(false)}
            />
          )}
        </div>
      </div>

      {musicPlayerOpen && <SideAudioPlayer onClose={() => setMusicPlayerOpen(false)} />}
      {soundOpen && <SoundPanel onClose={() => setSoundOpen(false)} />}
      {diceCoinOpen && <DiceCoinModal onClose={() => setDiceCoinOpen(false)} />}
      {designOpen && <DesignModal currentTemplate={currentTemplate} setTemplate={setTemplate} onClose={() => setDesignOpen(false)} />}
      {historyOpen && <HistoryModal history={[...player1.history, ...player2.history]} onClose={() => setHistoryOpen(false)} />}
      {settingsOpen && <SettingsModal lpInitial={lpInitial} setLpInitial={setLpInitial} player1={player1} player2={player2} onClose={() => setSettingsOpen(false)} />}
    </div>
  )
}

export default function BattlePage() {
  const [mode, setMode] = useState(null)
  const [currentTemplate, setTemplate] = useState(TEMPLATES[0])

  if (mode === '1') return <SinglePlayerBattle onBack={() => setMode(null)} currentTemplate={currentTemplate} setTemplate={setTemplate} />
  if (mode === '2') return <DuoPlayerBattle onBack={() => setMode(null)} currentTemplate={currentTemplate} setTemplate={setTemplate} />

  return (
    <div className="battle-selection">
      <div className="battle-selection-title">
        ⚔️ Irá calcular pontos de vida para 1 ou 2 jogadores?
      </div>
      <div className="battle-selection-options">
        <button className="battle-select-btn" onClick={() => setMode('1')}>
          <div className="battle-select-avatar">
            <img src="/yugi.png" alt="Yugi" />
          </div>
          <span className="battle-select-label">1 Jogador</span>
        </button>
        <button className="battle-select-btn" onClick={() => setMode('2')}>
          <div className="battle-select-avatar duo-avatar">
            <img src="/yugi_kaiba.jpg" alt="Yugi e Kaiba" />
          </div>
          <span className="battle-select-label">2 Jogadores</span>
          <span className="battle-select-desc">Mesmo dispositivo (Versus)</span>
        </button>
      </div>
    </div>
  )
}
