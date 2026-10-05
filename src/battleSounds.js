/**
 * Sons da batalha em um modulo compartilhado, para que a tela de Campo de
 * Batalha possa tocar efeitos sem importar o BattlePage (import circular).
 */
export const BATTLE_SOUNDS = {
  'point-drop': '/sounds/point-drop.mp3',
  mamaco: '/sounds/eu-vim-ver-o-mamaco.mp3',
  'hora-do-duelo': '/sounds/yu-gi-oh-e-hora-do-duelo.mp3',
  'life-points': '/sounds/yugioh-life-points.mp3',
  'oh-no-oh-yes': '/sounds/yugioh-oh-no-oh-yes.mp3',
  'sua-vez': '/sounds/sua-vez.mp3',
  meme: '/sounds/yugioh-meme.mp3',
  'time-to-duel': '/sounds/Its-time-to-duel.mp3',
  'baixar-carta': '/sounds/yugioh-baixar-carta.mp3',
}

const audioCache = new Map()

/**
 * Cria todos os elementos de audio assim que o modulo carrega.
 *
 * Criar sob demanda (na hora do play) fazia o primeiro toque esperar o
 * download e a decodificacao do arquivo -- alguns segundos de atraso no
 * efeito de baixar carta. Criando aqui, o preload acontece em paralelo com
 * o carregamento da tela e o som ja esta pronto quando o usuario clica.
 */
if (typeof window !== 'undefined') {
  Object.entries(BATTLE_SOUNDS).forEach(([key, src]) => {
    const audio = new Audio(src)
    audio.preload = 'auto'
    audio.load()
    audioCache.set(key, audio)
  })
}

const getAudio = (key) => audioCache.get(key) || null

/**
 * Destrava o audio no primeiro gesto do usuario.
 *
 * Navegadores bloqueiam audio antes de qualquer interacao. Uma reproducao
 * silenciosa e instantaneamente abortada libera o contexto, de modo que os
 * efeitos toquem de imediato na primeira troca de carta.
 */
export function warmupBattleSounds() {
  if (typeof window === 'undefined') return

  const unlock = () => {
    audioCache.forEach((audio) => {
      const previousVolume = audio.volume
      audio.volume = 0
      audio.play().then(() => {
        audio.pause()
        audio.currentTime = 0
        audio.volume = previousVolume
      }).catch(() => {})
    })

    window.removeEventListener('pointerdown', unlock)
    window.removeEventListener('keydown', unlock)
  }

  window.addEventListener('pointerdown', unlock, { once: true })
  window.addEventListener('keydown', unlock, { once: true })
}

/** Toca um efeito instantaneamente, ignorando o erro de autoplay bloqueado. */
export function playBattleSound(key) {
  const audio = getAudio(key)
  if (!audio) return

  // currentTime = 0 reinicia o efeito para calls repetidas tocarem de novo.
  if (audio.currentTime > 0) audio.currentTime = 0

  const result = audio.play()
  if (result?.catch) result.catch(() => {})
}
