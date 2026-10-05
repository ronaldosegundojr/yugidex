# Yugidex - Battlefield/Field Screen Implementation Plan

## Overview
Add a second "Campo de Batalha" (Battlefield) screen to `/batalha` that works as a horizontal carousel with the existing LP counter screen. Users can swipe left/right to switch between screens.

## Architecture

### State Management
- **BattlePage** becomes the parent container managing the carousel
- **useFieldState hook** - manages field state (slots, cards, modifications) with localStorage persistence
- **useCardSearch hook** - reuses deck search logic (debounce, filtering, normalization)
- Both LP state (existing) and Field state are preserved when switching screens
- Field state resets when battle is reset/ended (same as LP history)

### Component Structure
```
BattlePage (carousel container)
├── BattleCarousel (swipe/navigation logic)
│   ├── Screen 0: LP Screen (existing SinglePlayerBattle/DuoPlayerBattle)
│   └── Screen 1: FieldScreen (new)
│       ├── FieldSide (opponent - top, rotated 180°)
│       │   ├── FieldZone[] (all Yu-Gi-Oh zones)
│       │   └── PlayerIndicator (red diamond)
│       ├── FieldSeparator (central divider)
│       ├── FieldSide (player - bottom)
│       │   ├── FieldZone[] (all Yu-Gi-Oh zones)
│       │   └── PlayerIndicator (blue diamond)
│       └── BackToLPButton
├── FieldSlot (clickable slot, shows card art + compact stats)
├── SlotEditorModal (full card stats editor)
│   ├── CardSearch (reuses deck search)
│   ├── StatAdjuster (ATK/DEF/Level with +/- buttons, manual input, quick adjust)
│   └── Reset buttons
└── StatAdjuster (reusable component for each stat)
```

## Yu-Gi-Oh Field Zones (per player)

| Zone | Count | Position | Accepts |
|------|-------|----------|---------|
| Main Monster Zones | 5 | Bottom row center | Monsters |
| Extra Monster Zones | 2 | Left/right of monster row | Extra Deck monsters |
| Spell/Trap Zones | 5 | Row above monsters | Spells/Traps |
| Field Spell Zone | 1 | Left of Spell/Trap row | Field Spells |
| Pendulum Zones | 2 | Left/right of Spell/Trap | Pendulum cards |
| Graveyard | 1 | Right of field | Any (discard) |
| Banished Zone | 1 | Right of Graveyard | Any (banished) |
| Deck Zone | 1 | Right of field (far) | Deck |

**Total per player: 18 zones**

For 1 player mode: Only show player side (bottom)
For 2 player mode: Show both sides, opponent rotated 180° at top

## Files to Create

1. `src/hooks/useFieldState.js` - Field state management + localStorage
2. `src/hooks/useCardSearch.js` - Card search logic (reused from DeckPage)
3. `src/components/BattleCarousel.jsx` - Carousel/swipe container
4. `src/components/FieldScreen.jsx` - Main field screen component
5. `src/components/FieldSide.jsx` - One player's field side
6. `src/components/FieldZone.jsx` - Individual zone/slot
7. `src/components/FieldSlot.jsx` - Slot with card display
8. `src/components/SlotEditorModal.jsx` - Modal for editing slot
9. `src/components/StatAdjuster.jsx` - ATK/DEF/Level adjuster component
10. `src/components/PlayerIndicator.jsx` - Blue/red diamond indicators

## Files to Modify

1. `src/BattlePage.jsx` - Integrate carousel, preserve LP state
2. `src/BattlePage.css` - Add all field styles, carousel animations

## Carousel Implementation

### Approach: CSS Scroll Snap + Touch Events
- No heavy library needed (project has @dnd-kit but that's for drag-drop)
- Use `display: flex` + `overflow-x: hidden` + `scroll-snap-type: x mandatory`
- Touch handling with pointer events for swipe detection
- Desktop: mouse drag + keyboard arrows (←/→)
- Page indicators (2 dots) + explicit "Voltar aos Pontos de Vida" button

### Swipe Detection
- Minimum horizontal displacement: 50px
- Horizontal/vertical ratio > 2:1 to avoid scroll conflicts
- Ignore swipe when interacting with buttons, inputs, modals
- Smooth transition with `transform: translateX()`

## Field State Persistence

```javascript
// localStorage key: `ygo_battle_field_${mode}` where mode = '1' or '2'
{
  version: 1,
  playerSide: {
    zones: [
      { zoneId: 'monster-1', cardId: 123, atk: 2500, def: 2000, level: 4, originalAtk: 2500, originalDef: 2000, originalLevel: 4 },
      { zoneId: 'spell-1', cardId: 456, atk: null, def: null, level: null, ... },
      ...
    ]
  },
  opponentSide: { ... } // only for mode 2
}
```

## Card Search Reuse

Reuse from DeckPage:
- `normalizeText()` function
- `cards` array with `_normalizedNames`, `_ptName`, `_cardType`, etc.
- Debounce (200ms)
- Filters: type, level, attribute, race
- Language toggle (PT/EN/JP)

## StatAdjuster Details

### For Monsters with ATK/DEF:
- Display: Current value (colored: green > original, red < original, neutral = original)
- Show original discreetly: "Original: 1800"
- Buttons: ±100, ±500, ±1000
- Manual input field
- Reset button per stat

### For Link Monsters (no DEF):
- Only ATK adjuster
- Link Rating adjuster (arrows instead of stars)

### For Xyz Monsters:
- Rank instead of Level
- ATK/DEF adjusters

### For Spells/Traps:
- No ATK/DEF/Level adjusters
- Just card selection/removal

## Visual Design

### Playmat Style
- Background: Same as LP screen (reuse `currentTemplate.bgGradient`)
- Grid: Rectangular slots with 59:86 ratio (~0.686)
- Thin light borders, translucent blue fill
- Central divider line separating players
- Player indicators: Blue diamond (player), Red diamond (opponent) - matching LP colors

### Responsive
- Slots scale with viewport width
- No horizontal scroll on mobile
- Vertical scroll if needed (smooth)
- Touch targets ≥ 44px

## Accessibility
- `aria-label` on all buttons
- Focus management on modal open/close
- ESC to close modal
- Color + icon for stat changes (▲ green, ▼ red)
- Keyboard navigation (arrows for carousel, Tab for slots)

## Edge Cases
- Card with ATK/DEF = "?" or null → show "?" or handle gracefully
- Negative values → clamp to 0
- API failure → show error, keep previous state
- Same card in multiple slots → each slot independent
- Level/Rank/Link limits: 1-12 (per Yu-Gi-Oh rules)

## Testing Checklist

### Carousel
- [ ] Swipe left/right on mobile
- [ ] Mouse drag on desktop
- [ ] Keyboard arrows (←/→)
- [ ] Page indicators update
- [ ] "Voltar aos Pontos de Vida" button works
- [ ] LP state preserved when switching
- [ ] Field state preserved when switching
- [ ] No swipe conflict with buttons/inputs/modals

### Field Screen
- [ ] 1 player: only bottom side shown
- [ ] 2 players: both sides, opponent rotated 180°
- [ ] All 18 zones per player rendered
- [ ] Slots scale responsively (360px - 768px+)
- [ ] Background matches LP screen template

### Slot Interaction
- [ ] Click slot → opens modal
- [ ] Modal shows card search with debounce
- [ ] Select card → shows in slot with art
- [ ] Monster: ATK/DEF/Level editors appear
- [ ] Link: only ATK + Link Rating
- [ ] Xyz: ATK/DEF + Rank
- [ ] Spell/Trap: no stat editors
- [ ] Color coding: green/red/neutral
- [ ] Original value shown
- [ ] ±100/±500/±1000 buttons work
- [ ] Manual input works
- [ ] Reset per stat works
- [ ] Reset all works
- [ ] Remove card works
- [ ] Close modal saves automatically
- [ ] Compact display shows ATK/DEF/Level with colors

### Persistence
- [ ] Reload page → field restored
- [ ] Navigate away/back → field restored
- [ ] Reset battle → field cleared
- [ ] Mode switch (1↔2) → appropriate field shown

### Accessibility
- [ ] ARIA labels present
- [ ] Focus trapped in modal
- [ ] ESC closes modal
- [ ] Color + icons for changes
- [ ] Touch targets ≥ 44px