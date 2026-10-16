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
function FittedText({ text, baseSize, box, className, style }) {
  const ref = useRef(null)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    let fs = baseSize
    el.style.fontSize = fs + 'px'
    let guard = 0
    while (
      (el.scrollHeight > el.clientHeight + 1 || el.scrollWidth > el.clientWidth + 1) &&
      fs > 6 &&
      guard < 220
    ) {
      fs -= 1
      el.style.fontSize = fs + 'px'
      guard++
    }
  }, [text, baseSize, box.w, box.h])

  return (
    <div ref={ref} className={className} style={{ ...style, fontSize: baseSize }}>
      {text}
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
  const scriptWord = trapSpell
    ? `[ ${state.type.charAt(0).toUpperCase()}${state.type.slice(1)} Card ]`
    : ''
  const effectFont = isNormalMonster(state) ? '"Stone Serif Italic", serif' : '"Matrix Book", serif'

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
        <img className="ycm-layer" style={absStyle({ x: 0, y: 0, w: CARD_W, h: CARD_H }, -1)} src={frame('other/border-full.png')} alt="" />

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
        <FittedText
          text={state.name || 'Nome da Carta'}
          baseSize={65}
          box={L.name}
          className={`ycm-name ${rarity} ${whiteName ? 'white' : ''}`}
          style={absStyle(L.name, 4)}
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
          <div className="ycm-type" style={absStyle(L.type, 3)}>
            [{state.monsterType || ''}]
          </div>
        )}

        {/* lore / efeito */}
        <FittedText
          text={state.effect || ''}
          baseSize={20}
          box={L.effect}
          className="ycm-effect"
          style={absStyle(L.effect, 3, { fontFamily: effectFont })}
        />

        {/* efeito do pendulo */}
        {L.isPendulum && (
          <FittedText
            text={state.pendulumEffect || ''}
            baseSize={20}
            box={L.effectPendulum}
            className="ycm-effect"
            style={absStyle(L.effectPendulum, 3, { fontFamily: '"Matrix Book", serif' })}
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

        {/* magia/armadilha */}
        {trapSpell && (
          <>
            {state.spellTrapIcon && (
              <img className="ycm-layer" style={absStyle(L.spellTrapIcon, 1)} src={frame(`icons/${state.spellTrapIcon}.png`)} alt="" />
            )}
            <div className="ycm-spell-label" style={absStyle(L.spellTrapLabel, 3)}>
              {scriptWord}
            </div>
          </>
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
        <div className={`ycm-small ${whiteFooter ? 'white' : ''}`} style={absStyle(L.year, 1, { textAlign: 'right' })}>
          {state.year ? `© ${state.year}${state.creator ? ' ' + state.creator : ''}` : ''}
        </div>
        <div className="ycm-footer" style={absStyle(L.footer, 1)}>
          {state.footer}
        </div>

        {/* holograma */}
        <img className="ycm-layer" style={absStyle(L.hologram, 2)} src={frame('other/Hologram.png')} alt="" />
      </div>
    </div>
  )
}
