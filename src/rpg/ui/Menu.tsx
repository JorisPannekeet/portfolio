import { useEffect, useRef, useState } from 'react'
import type { Renderer } from '../render/renderer.ts'
import type { State } from '../sim/state.ts'
import {
  AREA_COUNT,
  CMD_EQUIP,
  CMD_LEARN,
  CMD_SCRAP,
  CMD_SOCKET,
  CMD_UNEQUIP,
  ELEMENT_COUNT,
  MELODY_COUNT,
  MELODY_ROADS,
  NODES_PER_TREE,
  SLOT_COUNT,
  TREE_COUNT,
  itemSet,
} from '../sim/content.ts'
import { command } from '../sim/step.hot.ts'
import { strings } from './i18n.ts'
import { MENU_TABS, type MenuTab } from './shell.ts'
import { hornArg, socketArg } from './controls.ts'
import {
  bitsSet,
  describeItem,
  fill,
  powerCompare,
  type ForgeOption,
  describeNode,
  equippedSlot,
  packIndices,
  forgeOptions,
  itemName,
  nodeStatus,
  readItem,
  scrapLine,
  setProgress,
} from './describe.ts'
import { ElementIcon, ItemIcon } from './Overlays.tsx'

type Send = (input: number) => void

function Purse({ s }: { s: State }) {
  return (
    <dl className="rpg-purse">
      <div data-coin="gold"><dt>{strings.gold}</dt><dd>{s.gold}</dd></div>
      <div data-coin="ore"><dt>{strings.ore}</dt><dd>{s.ore}</dd></div>
    </dl>
  )
}

function ItemSlot({ s, index, label, slot, selected, renderer, onSelect }: {
  s: State
  index: number
  label: string
  slot?: number
  selected: boolean
  renderer: Renderer | null
  onSelect: (index: number) => void
}) {
  const item = index >= 0 ? readItem(s, index) : null
  return (
    <button
      type="button"
      className="rpg-slot"
      data-tier={item ? item.tier : undefined}
      data-slot={slot}
      aria-pressed={selected}
      aria-label={item ? `${label}: ${itemName(strings, item)}` : `${label}: ${strings.emptySlot}`}
      title={slot === undefined ? undefined : label}
      disabled={!item}
      onClick={() => onSelect(index)}
    >
      {item && <ItemIcon renderer={renderer} base={item.base} tier={item.tier} className="rpg-slot-icon" />}
      {item && item.level > 0 && <span className="rpg-slot-level" aria-hidden="true">{fill(strings.itemLevel, [item.level])}</span>}
      {item && item.rune >= 0 && <span className="rpg-slot-rune" data-el={item.rune} aria-hidden="true" />}
    </button>
  )
}

interface PickerProps {
  s: State
  selected: number
  renderer: Renderer | null
  onSelect: (index: number) => void
}

function Doll({ s, selected, renderer, onSelect }: PickerProps) {
  return (
    <section className="rpg-doll" aria-labelledby="rpg-doll-head">
      <h3 id="rpg-doll-head" className="rpg-subhead">{strings.equipped}</h3>
      <div className="rpg-doll-body">
        {Array.from({ length: SLOT_COUNT }, (_, slot) => {
          const index = s.equipped[slot] ?? -1
          return (
            <ItemSlot
              key={slot}
              s={s}
              index={index}
              slot={slot}
              label={strings.slotName[slot] ?? ''}
              selected={index >= 0 && index === selected}
              renderer={renderer}
              onSelect={onSelect}
            />
          )
        })}
      </div>
    </section>
  )
}

function Pack({ s, selected, renderer, onSelect }: PickerProps) {
  return (
    <section className="rpg-pack" aria-labelledby="rpg-pack-head">
      <div className="rpg-pack-head">
        <h3 id="rpg-pack-head" className="rpg-subhead">{strings.inventory}</h3>
        <Purse s={s} />
      </div>
      <div className="rpg-grid">
        {packIndices(s).map(index => (
          <ItemSlot key={index} s={s} index={index} label={strings.inventory} selected={index === selected} renderer={renderer} onSelect={onSelect} />
        ))}
      </div>
    </section>
  )
}

function ItemDetail({ s, index, send }: { s: State; index: number; send: Send | null }) {
  const item = index >= 0 ? readItem(s, index) : null
  if (!item) return <div className="rpg-detail rpg-detail--empty"><p className="rpg-empty">{strings.noSelection}</p></div>
  const view = describeItem(strings, item)
  const compare = powerCompare(strings, s, index)
  const slot = equippedSlot(s, index)
  return (
    <div className="rpg-detail" data-tier={item.tier}>
      <p className="rpg-detail-tier">{`${view.tier} · ${view.slot}`}</p>
      <h3 className="rpg-detail-name">{view.name}</h3>
      <ul className="rpg-lines">
        <li className="rpg-power" data-delta={compare ? Math.sign(compare.delta) : undefined}>{compare ? compare.text : view.power}</li>
        {view.lines.map((line, k) => <li key={k}>{line}</li>)}
      </ul>
      {view.handling && <p className="rpg-note">{view.handling}</p>}
      {view.set && (
        <p className="rpg-note rpg-set">
          <span className="rpg-note-label">{`${strings.setLabel}: ${view.set} · ${setProgress(strings, s, itemSet(item.base))}`}</span>
          <span>{view.setBonus}</span>
        </p>
      )}
      {send && (
        <div className="rpg-row">
          {slot >= 0 ? (
            <button type="button" className="btn btn--frame play-btn" onClick={() => send(command(CMD_UNEQUIP, slot))}>{strings.unequip}</button>
          ) : (
            <>
              <button type="button" className="btn btn--primary play-btn" onClick={() => send(command(CMD_EQUIP, index))}>{strings.equip}</button>
              <button type="button" className="btn btn--frame play-btn" onClick={() => send(command(CMD_SCRAP, index))}>
                {`${strings.scrap} (${scrapLine(strings, item)})`}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}

function KeyItems({ s }: { s: State }) {
  const owned = bitsSet(s.keyItems, strings.keyItemName.length)
  if (owned.length === 0) return null
  return (
    <ul className="rpg-keys">
      {owned.map(key => (
        <li key={key}><strong>{strings.keyItemName[key]}</strong>{` ${strings.keyItemUse[key]}`}</li>
      ))}
    </ul>
  )
}

export function GearTab({ s, selected, renderer, onSelect, send }: { s: State; selected: number; renderer: Renderer | null; onSelect: (i: number) => void; send: Send }) {
  return (
    <div className="rpg-gear">
      <div className="rpg-gear-left">
        <Doll s={s} selected={selected} renderer={renderer} onSelect={onSelect} />
        <KeyItems s={s} />
      </div>
      <Pack s={s} selected={selected} renderer={renderer} onSelect={onSelect} />
      <ItemDetail s={s} index={selected} send={send} />
    </div>
  )
}

export function SkillsTab({ s, renderer, send }: { s: State; renderer: Renderer | null; send: Send }) {
  return (
    <div>
      <p className="rpg-points">{`${strings.skillPoints}: ${s.skillPoints}`}</p>
      <div className="rpg-trees">
        {Array.from({ length: TREE_COUNT }, (_, tree) => (
          <section key={tree} className="rpg-tree" data-el={tree} aria-labelledby={`rpg-tree-${tree}`}>
            <h3 id={`rpg-tree-${tree}`} className="rpg-tree-head">
              {tree < ELEMENT_COUNT
                ? <ElementIcon renderer={renderer} element={tree} className="rpg-tree-icon" />
                : <span className="rpg-tree-icon rpg-tree-icon--steel" aria-hidden="true" />}
              {strings.treeName[tree]}
            </h3>
            <ol className="rpg-nodes">
              {Array.from({ length: NODES_PER_TREE }, (_, k) => {
                const node = tree * NODES_PER_TREE + k
                const status = nodeStatus(strings, s, node)
                return (
                  <li key={node} className="rpg-node" data-state={status.state} data-cap={k === NODES_PER_TREE - 1 || undefined}>
                    <span className="rpg-socket" aria-hidden="true" />
                    <span className="rpg-node-name">{strings.nodeName[node]}</span>
                    <span className="rpg-node-effect">{describeNode(strings, node)}</span>
                    {status.state === 'available' ? (
                      <button type="button" className="btn btn--primary play-btn rpg-node-btn" onClick={() => send(command(CMD_LEARN, node))}>
                        {strings.learn}
                      </button>
                    ) : (
                      <span className="rpg-node-state">{status.reason}</span>
                    )}
                  </li>
                )
              })}
            </ol>
          </section>
        ))}
      </div>
    </div>
  )
}

function Costs({ s, option }: { s: State; option: ForgeOption }) {
  return (
    <span className="rpg-costs">
      {option.gold > 0 && <span className="rpg-cost" data-coin="gold" data-short={s.gold < option.gold || undefined}>{fill(strings.costGold, [option.gold])}</span>}
      {option.ore > 0 && <span className="rpg-cost" data-coin="ore" data-short={s.ore < option.ore || undefined}>{fill(strings.costOre, [option.ore])}</span>}
      {option.note && <span className="rpg-node-state">{option.note}</span>}
    </span>
  )
}

export function ForgeTab({ s, selected, renderer, onSelect, send }: { s: State; selected: number; renderer: Renderer | null; onSelect: (i: number) => void; send: Send }) {
  const item = selected >= 0 ? readItem(s, selected) : null
  return (
    <div className="rpg-gear">
      <div className="rpg-gear-left">
        <Doll s={s} selected={selected} renderer={renderer} onSelect={onSelect} />
      </div>
      <Pack s={s} selected={selected} renderer={renderer} onSelect={onSelect} />
      <div className="rpg-anvil">
        <ItemDetail s={s} index={selected} send={null} />
        {item && (
          <ul className="rpg-forge">
            {forgeOptions(strings, s, item).map(option => (
              <li key={`${option.opcode}-${option.element}`} className="rpg-forge-row">
                <span className="rpg-node-name">{option.label}</span>
                {option.after ? (
                  <span className="rpg-preview">
                    <span className="rpg-before">{option.before}</span>
                    <span className="rpg-arrow">{strings.arrow}</span>
                    <span className="rpg-after">{option.after}</span>
                  </span>
                ) : (
                  <span className="rpg-preview"><span className="rpg-after">{option.before}</span></span>
                )}
                <Costs s={s} option={option} />
                <button
                  type="button"
                  className="btn btn--primary play-btn rpg-node-btn"
                  disabled={!option.enabled}
                  onClick={() => send(command(option.opcode, option.opcode === CMD_SOCKET ? socketArg(selected, option.element) : selected))}
                >
                  {option.label}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

export function HornTab({ s, onHorn }: { s: State; onHorn: (arg: number) => void }) {
  const melodies = bitsSet(s.melodies, MELODY_COUNT)
  if (melodies.length === 0) return <p className="rpg-empty">{strings.noMelodies}</p>
  const waystones = bitsSet(s.waystones, AREA_COUNT)
  return (
    <ul className="rpg-melodies">
      {melodies.map(melody => (
        <li key={melody} className="rpg-melody">
          <span className="rpg-node-name">{strings.melodyName[melody]}</span>
          <span className="rpg-node-effect">{strings.melodyEffect[melody]}</span>
          {melody !== MELODY_ROADS ? (
            <button type="button" className="btn btn--primary play-btn rpg-node-btn" onClick={() => onHorn(hornArg(melody, 0))}>{strings.play}</button>
          ) : waystones.length === 0 ? (
            <span className="rpg-node-state">{strings.noWaystones}</span>
          ) : (
            <ul className="rpg-places" aria-label={strings.roads}>
              {waystones.map(area => (
                <li key={area}>
                  <button type="button" className="rpg-place" onClick={() => onHorn(hornArg(MELODY_ROADS, area))}>
                    {strings.areaName[area]}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </li>
      ))}
    </ul>
  )
}

export function MenuOverlay({ s, tab, version, renderer, onTab, onClose, send, onHorn }: {
  s: State
  tab: MenuTab
  version: number
  renderer: Renderer | null
  onTab: (tab: MenuTab) => void
  onClose: () => void
  send: Send
  onHorn: (arg: number) => void
}) {
  const [picked, setSelected] = useState(-1)
  const selected = picked >= 0 && (s.invBase[picked] ?? -1) >= 0 ? picked : -1
  const closeRef = useRef<HTMLButtonElement | null>(null)
  useEffect(() => {
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null
    closeRef.current?.focus()
    return () => previous?.focus()
  }, [])
  const forgeOpen = s.nearForge === 1
  return (
    <div className="play-overlay rpg-menu-overlay" role="dialog" aria-modal="true" aria-labelledby={`rpg-tab-${tab}`}>
      <div className="play-panel rpg-panel rpg-menu" data-version={version}>
        <div className="rpg-tabs rpg-plaque" role="tablist">
          {MENU_TABS.map(name => (
            <button
              key={name}
              id={`rpg-tab-${name}`}
              type="button"
              role="tab"
              className="rpg-tab"
              aria-selected={name === tab}
              aria-controls="rpg-tabpanel"
              disabled={name === 'forge' && !forgeOpen}
              title={name === 'forge' && !forgeOpen ? strings.forgeAway : undefined}
              onClick={() => onTab(name)}
            >
              {strings.tabs[name]}
            </button>
          ))}
        </div>
        <button ref={closeRef} type="button" className="rpg-close" aria-label={strings.close} title={strings.close} onClick={onClose} />
        <div id="rpg-tabpanel" role="tabpanel" aria-labelledby={`rpg-tab-${tab}`} className="rpg-tabpanel">
          {tab === 'gear' && <GearTab s={s} selected={selected} renderer={renderer} onSelect={setSelected} send={send} />}
          {tab === 'skills' && <SkillsTab s={s} renderer={renderer} send={send} />}
          {tab === 'forge' && (forgeOpen
            ? <ForgeTab s={s} selected={selected} renderer={renderer} onSelect={setSelected} send={send} />
            : <p className="rpg-empty">{strings.forgeAway}</p>)}
          {tab === 'horn' && <HornTab s={s} onHorn={onHorn} />}
        </div>
      </div>
    </div>
  )
}
