import { memo } from 'react'
import { useDraggable } from '@dnd-kit/core'
import './YGOCard.css'

const getCardPatternClass = (card) => {
  if (card.cardType === 'spell') return 'spell'
  if (card.cardType === 'trap') return 'trap'
  
  const cardType = card.cardType?.toLowerCase() || ''
  const type = card.type?.toLowerCase() || ''
  
  if (cardType === 'link' || type === 'link') return 'monster-link'
  if (cardType === 'xyz' || type === 'xyz') return 'monster-xyz'
  if (cardType === 'synchro' || type === 'synchro') return 'monster-synchro'
  if (cardType === 'fusion' || type === 'fusion') return 'monster-fusion'
  if (cardType === 'ritual' || type === 'ritual') return 'monster-ritual'
  if (card.pendulum) return 'monster-pendulum'
  if (cardType === 'normal' || card.classifications?.includes('normal')) return 'monster-normal'
  if (card.classifications?.includes('effect') || card.effect) return 'monster-effect'
  
  return 'monster-effect'
}

const getAttributeClass = (attr) => {
  if (!attr) return ''
  return `attr-${attr.toLowerCase()}`
}

const getMonsterType = (card) => {
  const types = []
  if (card.type) types.push(card.type)
  if (card.cardType && card.cardType !== 'monster' && card.cardType !== 'spell' && card.cardType !== 'trap') {
    types.push(card.cardType.charAt(0).toUpperCase() + card.cardType.slice(1))
  }
  if (card.classifications) {
    card.classifications.forEach(c => {
      if (!types.some(t => t.toLowerCase() === c.toLowerCase())) {
        types.push(c.charAt(0).toUpperCase() + c.slice(1))
      }
    })
  }
  return types.join(' / ')
}

const getSpellType = (card) => {
  const subcategory = card.subcategory?.toLowerCase() || ''
  if (subcategory === 'normal') return 'spell-normal'
  if (subcategory === 'quick-play') return 'spell-quickplay'
  if (subcategory === 'continuous') return 'spell-continuous'
  if (subcategory === 'equip') return 'spell-equip'
  if (subcategory === 'field') return 'spell-field'
  if (subcategory === 'ritual') return 'spell-ritual'
  return 'spell-normal'
}

const getTrapType = (card) => {
  const subcategory = card.subcategory?.toLowerCase() || ''
  if (subcategory === 'normal') return 'trap-normal'
  if (subcategory === 'continuous') return 'trap-continuous'
  if (subcategory === 'counter') return 'trap-counter'
  return 'trap-normal'
}

export const YGOCard = memo(({ card, onClick, size = 'normal', draggable = false }) => {
  const patternClass = getCardPatternClass(card)
  const attrClass = getAttributeClass(card.attribute)
  const isMonster = card.cardType !== 'spell' && card.cardType !== 'trap'
  const isSpell = card.cardType === 'spell'
  const isTrap = card.cardType === 'trap'
  const hasLevel = isMonster && card.level && !['link', 'xyz'].includes(card.cardType?.toLowerCase())
  const hasRank = card.cardType === 'xyz'
  const isLink = card.cardType === 'link' || card.type?.toLowerCase() === 'link'
  
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: card.id,
    disabled: !draggable
  })
  
  const cardName = card.text?.en?.name || 'Unknown'
  const cardEffect = card.text?.en?.effect || card.text?.pt?.effect || ''
  const imageUrl = card.images?.[0]?.art || card.images?.[0]?.card || ''
  const password = card.passwords?.[0] || ''
  
  const sizeClass = size === 'large' ? 'ygo-card-modal-large' : ''

  const handleClick = (e) => {
    if (!isDragging && onClick) {
      onClick(card)
    }
  }

  return (
    <div 
      ref={setNodeRef}
      className={`ygo-card ${patternClass} ${sizeClass} ${isDragging ? 'dragging' : ''}`} 
      onClick={handleClick}
      {...(draggable ? { ...listeners, ...attributes } : {})}
      style={{ cursor: draggable ? 'grab' : 'pointer', opacity: isDragging ? 0.5 : 1 }}
    >
      <div className="ygo-card-frame">
        <div className="ygo-card-name-band">
          <span className="ygo-card-name">{cardName}</span>
          {card.attribute && (
            <div className="ygo-card-attr">
              <div className={`ygo-card-attr-circle ${attrClass}`}></div>
            </div>
          )}
        </div>

        {(hasLevel || hasRank || isLink) && (
          <div className="ygo-card-level">
            <div className="ygo-card-level-stars">
              {hasLevel && Array.from({ length: card.level }, (_, i) => (
                <div key={i} className="ygo-card-level-star normal"></div>
              ))}
              {hasRank && Array.from({ length: card.rank || card.level || 0 }, (_, i) => (
                <div key={i} className="ygo-card-level-star xyz"></div>
              ))}
              {isLink && Array.from({ length: card.linkRating || card.level || 0 }, (_, i) => (
                <div key={i} className="ygo-card-level-star link"></div>
              ))}
            </div>
          </div>
        )}

        <div className="ygo-card-image-container">
          {imageUrl && (
            <img 
              className="ygo-card-image" 
              src={imageUrl} 
              alt={cardName}
              loading="lazy"
            />
          )}
        </div>

        {isMonster && (
          <div className="ygo-card-type-box">
            <span className="ygo-card-monster-type">[{getMonsterType(card)}]</span>
          </div>
        )}

        <div className="ygo-card-text-box">
          {isSpell && (
            <div className={`ygo-card-spell-type ${getSpellType(card)}`}>
              <span className="ygo-card-spell-icon"></span>
              <span>[Spell Card]</span>
            </div>
          )}
          {isTrap && (
            <div className={`ygo-card-trap-type ${getTrapType(card)}`}>
              <span>[Trap Card]</span>
            </div>
          )}
          <p>{cardEffect}</p>
        </div>

        <div className="ygo-card-footer">
          {isMonster && card.atk !== undefined && (
            <span className="ygo-card-atkdef">
              ATK/{card.atk} {card.def !== undefined && `DEF/${card.def}`}
            </span>
          )}
          {isLink && card.linkRating && (
            <span className="ygo-card-atkdef">LINK-{card.linkRating}</span>
          )}
        </div>

        {password && (
          <span className="ygo-card-pass-code">{password}</span>
        )}
      </div>
    </div>
  )
})

export const YGOCardMini = memo(({ card, qty = 1, onClick, onRemove }) => {
  const patternClass = getCardPatternClass(card)
  const imageUrl = card.images?.[0]?.art || card.images?.[0]?.card || ''
  const cardName = card.text?.en?.name || ''

  return (
    <div className="ygo-card-mini" onClick={() => onClick?.(card)}>
      {imageUrl ? (
        <img src={imageUrl} alt={cardName} loading="lazy" />
      ) : (
        <div className={`ygo-card-pattern ${patternClass}`}></div>
      )}
      {qty > 1 && <span className="ygo-card-mini-qty">{qty}</span>}
      {onRemove && (
        <button className="ygo-card-mini-remove" onClick={(e) => { e.stopPropagation(); onRemove(card.id) }}>
          ×
        </button>
      )}
    </div>
  )
})

export default YGOCard
