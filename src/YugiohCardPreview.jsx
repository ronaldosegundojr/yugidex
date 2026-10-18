import { useLayoutEffect, useRef } from 'react'
import {
  CARD_W,
  CARD_H,
  frame,
  computeLayout,
  backgroundFile,
  attributeFile,
  starFile,
  linkArrowFile,
  LINK_ARROWS,
  countLinkArrows,
  isWhiteName,
  isWhiteFooter,
  isNormalMonster,
  CARD_TYPES,
} from './cardMakerData'
import './YugiohCardPreview.css'

// Texto que reduz a fonte automaticamente para caber na caixa (fitFont do cardmaker).
// Quando `autoFit` e false mantem o tamanho base (padrao do /criar-card), mesmo
// que o texto fique no limite da caixa.
function FittedText({ text, baseSize, box, className, style, autoFit = true }) {
  const ref = useRef(null)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    // Limite minimo de fonte: nunca reduz demais. Usa no maximo ~55% do tamanho
    // base e nunca abaixo de 11px (antes ia ate 6px, deixando o texto ilegivel).
    const min = Math.max(11, Math.round(baseSize * 0.55))
    const fit = () => {
      if (!autoFit) {
        el.style.fontSize = baseSize + 'px'
        return
      }
      let fs = baseSize
      el.style.fontSize = fs + 'px'
      let guard = 0
      while (
        (el.scrollHeight > el.clientHeight + 1 || el.scrollWidth > el.clientWidth + 1) &&
        fs > min &&
        guard < 400
      ) {
        // passo de 0.5px: para perto de onde realmente cabe, sem "pular" demais
        fs = Math.max(min, fs - 0.5)
        el.style.fontSize = fs + 'px'
        guard++
      }
    }
    fit()
    // reajusta quando as fontes locais terminarem de carregar (antes o texto era
    // medido com a fonte de fallback, bem mais larga, e ficava pequeno demais)
    if (document.fonts?.ready) document.fonts.ready.then(() => fit())
    if (document.fonts?.addEventListener) {
      document.fonts.addEventListener('loadingdone', fit)
      return () => document.fonts.removeEventListener('loadingdone', fit)
    }
  }, [text, baseSize, box.w, box.h, autoFit])

  return (
    <div ref={ref} className={className} style={{ ...style, fontSize: baseSize }}>
      {text}
    </div>
  )
}

// Texto que reduz o tamanho da fonte para caber na largura disponivel e, se
// ainda faltar espaco, comprime levemente na horizontal (squeeze do cardmaker).
// Com `autoFit` false o tamanho base e mantido e apenas comprime na horizontal.
function SqueezeText({ text, baseSize, box, className, style, autoFit = true }) {
  const wrapRef = useRef(null)
  const spanRef = useRef(null)

  useLayoutEffect(() => {
    const wrap = wrapRef.current
    const span = spanRef.current
    if (!wrap || !span) return
    const fit = () => {
      span.style.transform = 'none'
      // largura util = largura do conteudo (clientWidth inclui o padding)
      const cs = getComputedStyle(wrap)
      const pad = (parseFloat(cs.paddingLeft) || 0) + (parseFloat(cs.paddingRight) || 0)
      const avail = Math.max(0, wrap.clientWidth - pad)
      if (!avail) return
      // 1) reduz a fonte ate caber (min 45% do tamanho base, piso absoluto 9px).
      //    Com autoFit desligado o piso e o proprio tamanho base.
      const min = autoFit ? Math.max(9, Math.round(baseSize * 0.45)) : baseSize
      let fs = baseSize
      span.style.fontSize = fs + 'px'
      let guard = 0
      while (span.scrollWidth > avail + 1 && fs > min && guard < 120) {
        fs -= 1
        span.style.fontSize = fs + 'px'
        guard++
      }
      // 2) se ainda sobrar, comprime na horizontal
      span.style.transform = 'none'
      const need = span.scrollWidth
      if (need > avail + 1 && need > 0) {
        span.style.transform = `scaleX(${avail / need})`
      }
    }
    fit()
    // reajusta quando as fontes locais terminarem de carregar
    if (document.fonts?.ready) document.fonts.ready.then(() => fit())
    if (document.fonts?.addEventListener) {
      document.fonts.addEventListener('loadingdone', fit)
      return () => document.fonts.removeEventListener('loadingdone', fit)
    }
  }, [text, baseSize, box.w, autoFit])

  return (
    <div ref={wrapRef} className={`ycm-squeeze ${className || ''}`} style={style}>
      <span ref={spanRef} style={{ fontSize: baseSize }}>
        {text}
      </span>
    </div>
  )
}

const absStyle = (box, zIndex, extra = {}) => ({
  position: 'absolute',
  left: box.x + 'px',
  top: box.y + 'px',
  width: box.w + 'px',
  height: box.h + 'px',
  zIndex,
  ...extra,
})

export default function YugiohCardPreview({ state, width = 421, className = '', innerRef }) {
  const L = computeLayout(state)
  const whiteName = isWhiteName(state)
  const whiteFooter = isWhiteFooter(state)
  const trapSpell = L.isTrapSpell
  const scale = width / CARD_W
  const rarity = state.rarity || 'common'

  const stars = L.showLevel ? Math.max(0, Math.min(12, Number(state.level) || 0)) : 0
  const linkCount = countLinkArrows(state.linkArrows)
  const spellTrapWord = trapSpell ? (state.type === 'trap' ? 'Carta Armadilha' : 'Carta Mágica') : ''
  const effectFont = isNormalMonster(state) ? '"Stone Serif Italic", serif' : '"Matrix Book", serif'
  const autoFit = state.autoFit !== false
  // Acabamento metalizado/holografico (foil)
  const holographic = state.holographic === true
  // Nome vira foil quando a carta e holografica e a raridade nao define uma
  // folha propria (ouro/prata). Com ouro/prata a raridade ja cuida do nome.
  const holoName = holographic && rarity !== 'gold' && rarity !== 'silver'

  return (
    <div
      className={`ycm-scaler ${className}`}
      style={{ width: width + 'px', height: CARD_H * scale + 'px' }}
    >
      <div
        className="ycm-card"
        ref={innerRef}
        style={{ width: CARD_W + 'px', height: CARD_H + 'px', transform: `scale(${scale})` }}
      >
        {/* borda geral (atras) */}
        <img className="ycm-layer" style={absStyle({ x: 0, y: 0, w: CARD_W, h: CARD_H }, 0)} src={frame('other/border-full.png')} alt="" />

        {/* fundo do tipo */}
        <img className="ycm-layer" style={absStyle(L.background, 0)} src={frame(backgroundFile(state.type))} alt="" />

        {/* caixa de lore */}
        {!L.isPendulum && (
          <>
            <img className="ycm-layer" style={absStyle(L.loreBorder, 1)} src={frame('other/Lore Border.png')} alt="" />
            <img className="ycm-layer" style={absStyle(L.loreBackground, 1)} src={frame('other/Lore Background.png')} alt="" />
          </>
        )}

        {/* arte */}
        {L.isPendulum ? (
          <img className="ycm-layer" style={absStyle(L.pendulumArtbox, 1)} src={frame('other/Pendulum Artbox.png')} alt="" />
        ) : (
          <img className="ycm-layer" style={absStyle(L.artBox, 1)} src={frame('other/Art Box.png')} alt="" />
        )}
        {state.art ? (
          <div className={`ycm-art-clip ${L.isPendulum ? 'pendulum' : ''}`} style={absStyle(L.picture, 2)}>
            <img src={state.art} alt="" />
          </div>
        ) : (
          <div className="ycm-art-empty" style={absStyle(L.picture, 2)}>
            <span>ARTE</span>
          </div>
        )}

        {/* moldura do pendulo */}
        {L.isPendulum && (
          <>
            <img className="ycm-layer" style={absStyle(L.pendulumTexture, 1)} src={frame('other/Pendulum Half Texture.png')} alt="" />
            <img className="ycm-layer" style={absStyle(L.pendulumDesc, 2)} src={frame('other/Pendulum Description.png')} alt="" />
          </>
        )}

        {/* cabecalho + nome */}
        <img className="ycm-layer" style={absStyle(L.header, 1)} src={frame('other/Header.png')} alt="" />
          <SqueezeText
            text={state.name || 'Nome da Carta'}
            baseSize={Number(state.nameSize || 65)}
            box={L.name}
            className={`ycm-name ${rarity} ${whiteName && !state.nameColor ? 'white' : ''} ${holoName ? 'holo' : ''}`}
            style={{
              ...absStyle(L.name, 4),
              // Cor personalizada do titulo tem prioridade sobre o branco/preto
              // automatico e sobre as classes de raridade (foil continua no
              // background, mas o texto usa a cor escolhida).
              ...(state.nameColor
                ? { color: state.nameColor, WebkitTextFillColor: state.nameColor }
                : {}),
            }}
            autoFit={autoFit}
          />

        {/* atributo */}
        <img className="ycm-layer" style={absStyle(L.attribute, 1)} src={frame(attributeFile(state))} alt="" />

        {/* estrelas / ranks */}
        {L.showLevel &&
          Array.from({ length: stars }).map((_, i) => (
            <img
              key={i}
              className="ycm-layer"
              style={absStyle({ x: L.starX(i), y: L.star.y, w: L.star.w, h: L.star.h }, 1)}
              src={frame(starFile(state))}
              alt=""
            />
          ))}

        {/* setas de link */}
        {L.isLink &&
          LINK_ARROWS.map((a) => (
            <img
              key={a.id}
              className="ycm-layer"
              style={absStyle(L.linkArrow(a.id), 3)}
              src={frame(linkArrowFile(a.key, !!state.linkArrows?.[a.id]))}
              alt=""
            />
          ))}

        {/* linha de tipo do monstro */}
        {!trapSpell && (
          <SqueezeText
            text={`[${state.monsterType || ''}]`}
            baseSize={Number(state.typeSize || 26)}
            box={L.type}
            className="ycm-type"
            style={absStyle(L.type, 3)}
            autoFit={autoFit}
          />
        )}

        {/* lore / efeito */}
        <FittedText
          text={state.effect || ''}
          baseSize={Number(state.effectSize) > 0 ? Number(state.effectSize) : 24}
          box={L.effect}
          className="ycm-effect"
          autoFit={autoFit}
          style={absStyle(L.effect, 3, {
            fontFamily: effectFont,
            lineHeight: state.effectSpacing ? String(state.effectSpacing) : '1.15',
            textAlign: state.effectAlign || 'justify',
          })}
        />

        {/* efeito do pendulo */}
        {L.isPendulum && (
          <FittedText
            text={state.pendulumEffect || ''}
            baseSize={Number(state.effectSize) > 0 ? Number(state.effectSize) : 24}
            box={L.effectPendulum}
            className="ycm-effect"
            autoFit={autoFit}
            style={absStyle(L.effectPendulum, 3, {
              fontFamily: '"Matrix Book", serif',
              lineHeight: state.effectSpacing ? String(state.effectSpacing) : '1.15',
              textAlign: state.effectAlign || 'justify',
            })}
          />
        )}

        {/* escalas do pendulo */}
        {L.isPendulum && (
          <>
            <div className="ycm-scale" style={absStyle(L.scaleBlue, 21, { color: '#1a3a9c' })}>
              {state.scaleBlue}
            </div>
            <div className="ycm-scale" style={absStyle(L.scaleRed, 21, { color: '#a8231f' })}>
              {state.scaleRed}
            </div>
          </>
        )}

        {/* linha ATK/DEF */}
        {!trapSpell && (
          <img className="ycm-layer" style={absStyle(L.footerLine, 3)} src={frame('other/atk_def line.png')} alt="" />
        )}

        {/* magia/armadilha: "[ Carta Armadilha X ]" com o icone dentro dos colchetes */}
        {trapSpell && (
          <div className="ycm-spell-label" style={absStyle(L.spellTrapLabel, 3)}>
            <span className="ycm-spell-text">[ {spellTrapWord}</span>
            {state.spellTrapIcon && (
              <img
                className="ycm-spell-icon"
                src={frame(`icons/${state.spellTrapIcon}.png`)}
                alt=""
              />
            )}
            <span className="ycm-spell-text">]</span>
          </div>
        )}

        {/* ATK / DEF / LINK */}
        {!trapSpell &&
          (L.isLink ? (
            <>
              <img className="ycm-layer" style={absStyle(L.linkLabel, 3)} src={frame('other/LINK Label.png')} alt="" />
              <div className="ycm-atkdef ycm-linknum" style={absStyle(L.linkNumber, 5)}>
                {linkCount}
              </div>
            </>
          ) : (
            <>
              <div className="ycm-atkdef label" style={absStyle(L.atkLabel, 3)}>
                ATK/
              </div>
              <div className="ycm-atkdef value right" style={absStyle(L.atk, 3)}>
                {state.atk}
              </div>
              <div className="ycm-atkdef label" style={absStyle(L.defLabel, 3)}>
                DEF/
              </div>
              <div className="ycm-atkdef value right" style={absStyle(L.def, 3)}>
                {state.def}
              </div>
            </>
          ))}

        {/* dados de colecao */}
        {state.set && (
          <div className={`ycm-small ${whiteFooter ? 'white' : ''}`} style={absStyle(L.set, 3, { textAlign: 'right' })}>
            {state.set}
          </div>
        )}
        {state.serial && (
          <div className={`ycm-small ${whiteFooter ? 'white' : ''}`} style={absStyle(L.serial, 2, { textAlign: 'left' })}>
            {state.serial}
          </div>
        )}
        {state.edition && (
          <div className={`ycm-small ${whiteFooter ? 'white' : ''}`} style={absStyle(L.edition, 2, { textAlign: 'left' })}>
            {state.edition}
          </div>
        )}
        <SqueezeText
          text={state.year ? `© ${state.year}${state.creator ? ' ' + state.creator : ''}` : ''}
          baseSize={20}
          box={L.year}
          className={`ycm-small ${whiteFooter ? 'white' : ''}`}
          style={absStyle(L.year, 1, { justifyContent: 'flex-end', overflow: 'visible' })}
        />
        <div className="ycm-footer" style={absStyle(L.footer, 1)}>
          {state.footer}
        </div>

        {/* holograma */}
        <img className="ycm-layer" style={absStyle(L.hologram, 2)} src={frame('other/Hologram.png')} alt="" />

        {/* acabamento holografico / metalizado (foil) */}
        {holographic && (
          <>
            {/* prismatico + reflexo ficam sob o texto (z 2), mantendo a leitura
                do efeito/nome nitida; o brilho metalizado vai por cima (z 30) */}
            <div className="ycm-holo ycm-holo-prism" style={absStyle({ x: 0, y: 0, w: CARD_W, h: CARD_H }, 2)} />
            <div className="ycm-holo ycm-holo-sheen" style={absStyle({ x: 0, y: 0, w: CARD_W, h: CARD_H }, 2)} />
            <div className="ycm-holo ycm-holo-metal" style={absStyle({ x: 0, y: 0, w: CARD_W, h: CARD_H }, 30)} />
          </>
        )}
      </div>
    </div>
  )
}
