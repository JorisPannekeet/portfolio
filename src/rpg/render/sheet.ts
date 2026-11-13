import { KIND_GLYPH, KIND_PLAIN, type SpriteDef } from '../../game/render/atlas.ts'
import { fontFrames } from '../../game/sprites/font.ts'
import { ITEM_BASE_COUNT, ITEM_GREATSWORD, ITEM_SWORD } from '../sim/content.ts'
import { armorIcons, elementIcons, elementPips, iconGreatsword, iconSword } from '../sprites/items.ts'
import { frameList, legacy, native, spriteDef } from './frames.ts'
import { SPR_COUNT, SPR_DIGITS, SPR_ICONS } from './sheet-ids.ts'
import { HERO_DEFS } from './sheet-hero.ts'
import { FOES_DEFS } from './sheet-foes.ts'
import { WORLD_DEFS } from './sheet-world.ts'

export const ITEM_ICON = new Uint8Array(ITEM_BASE_COUNT)
const iconList = frameList()
native(iconList, iconSword, iconGreatsword, ...armorIcons)
ITEM_ICON[ITEM_SWORD] = 0
ITEM_ICON[ITEM_GREATSWORD] = 1
for (let base = ITEM_GREATSWORD + 1; base < ITEM_BASE_COUNT; base++) ITEM_ICON[base] = base
export const ELEMENT_PIP_FIRST = legacy(iconList, ...elementPips)
export const ELEMENT_ICON_FIRST = native(iconList, ...elementIcons)

export const FONT_ADVANCE = 4

const digitList = frameList()
legacy(digitList, ...fontFrames.slice(0, 10))

const CORE_DEFS: readonly (readonly [number, SpriteDef])[] = [
  [SPR_ICONS, spriteDef('icons', KIND_PLAIN, iconList)],
  [SPR_DIGITS, spriteDef('digits', KIND_GLYPH, digitList)],
]

function assemble(): SpriteDef[] {
  const defs: SpriteDef[] = []
  for (const [id, def] of [...CORE_DEFS, ...HERO_DEFS, ...FOES_DEFS, ...WORLD_DEFS]) {
    if (id < 0 || id >= SPR_COUNT || defs[id]) throw new Error(`sprite id ${id} (${def.name}) is out of range or taken`)
    defs[id] = def
  }
  for (let id = 0; id < SPR_COUNT; id++) if (!defs[id]) throw new Error(`sprite id ${id} has no def`)
  return defs
}

export const SPRITE_DEFS: readonly SpriteDef[] = assemble()
