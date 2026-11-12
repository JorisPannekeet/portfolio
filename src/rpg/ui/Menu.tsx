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
import { ItemIcon } from './Overlays.tsx'

type Send = (input: number) => void

function Purse({ s }: { s: State }) {
  return (
    <dl className="rpg-purse">
      <div><dt>{strings.gold}</dt><dd>{s.gold}</dd></div>
      <div><dt>{strings.ore}</dt><dd>{s.ore}</dd></div>
    </dl>
  )
}

function ItemSlot({ s, index, label, selected, renderer, onSelect }: {
  s: State
  index: number
  label: string
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
      aria-pressed={selected}
      aria-label={item ? `${label}: ${itemName(strings, item)}` : `${label}: ${strings.emptySlot}`}
      disabled={!item}
      onClick={() => onSelect(index)}
    >
      <ItemIcon renderer={renderer} base={item ? item.base : -1} tier={item ? item.tier : 0} className="rpg-slot-icon" />
    </button>
  )
}

function ItemPicker({ s, selected, renderer, onSelect }: { s: State; selected: number; renderer: Renderer | null; onSelect: (index: number) => void }) {
  return (
    <div className="rpg-picker">
      <h3 className="rpg-subhead">{strings.equipped}</h3>
      <div className="rpg-equipped">
        {Array.from({ length: SLOT_COUNT }, (_, slot) => {
          const index = s.equipped[slot] ?? -1
          return (
            <div key={slot} className="rpg-equip">
              <ItemSlot s={s} index={index} label={strings.slotName[slot] ?? ''} selected={index >= 0 && index === selected} renderer={renderer} onSelect={onSelect} />
              <span className="rpg-equip-label">{strings.slotName[slot]}</span>
            </div>
          )
        })}
      </div>
      <h3 className="rpg-subhead">{strings.inventory}</h3>
      <div className="rpg-grid">
        {packIndices(s).map(index => (
          <ItemSlot key={index} s={s} index={index} label={strings.inventory} selected={index === selected} renderer={renderer} onSelect={onSelect} />
        ))}
      </div>
    </div>
  )
}

function ItemDetail({ s, index, send }: { s: State; index: number; send: Send | null }) {
  const item = index >= 0 ? readItem(s, index) : null
  if (!item) return <p className="rpg-empty">{strings.noSelection}</p>
  const view = describeItem(strings, item)
  const slot = equippedSlot(s, index)
  return (
    <div className="rpg-detail" data-tier={item.tier}>
      <p className="rpg-detail-tier">{`${view.tier} · ${view.slot}`}</p>
      <h3 className="rpg-detail-name">{view.name}</h3>
      <ul className="rpg-lines">
        {view.lines.map((line, k) => <li key={k}>{line}</li>)}
      </ul>
      {view.handling && <p className="rpg-note">{view.handling}</p>}
      {view.set && (
        <p className="rpg-note">
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
    <div className="rpg-split">
      <div>
        <Purse s={s} />
        <ItemPicker s={s} selected={selected} renderer={renderer} onSelect={onSelect} />
        <KeyItems s={s} />
      </div>
      <ItemDetail s={s} index={selected} send={send} />
    </div>
  )
}

export function SkillsTab({ s, send }: { s: State; send: Send }) {
  return (
    <div>
      <p className="rpg-points">{`${strings.skillPoints}: ${s.skillPoints}`}</p>
      <div className="rpg-trees">
        {Array.from({ length: TREE_COUNT }, (_, tree) => (
          <section key={tree} className="rpg-tree" aria-labelledby={`rpg-tree-${tree}`}>
            <h3 id={`rpg-tree-${tree}`} className="rpg-subhead">{strings.treeName[tree]}</h3>
            <ol className="rpg-nodes">
              {Array.from({ length: NODES_PER_TREE }, (_, k) => {
                const node = tree * NODES_PER_TREE + k
                const status = nodeStatus(strings, s, node)
                return (
                  <li key={node} className="rpg-node" data-state={status.state}>
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

export function ForgeTab({ s, selected, renderer, onSelect, send }: { s: State; selected: number; renderer: Renderer | null; onSelect: (i: number) => void; send: Send }) {
  const item = selected >= 0 ? readItem(s, selected) : null
  return (
    <div className="rpg-split">
      <div>
        <Purse s={s} />
        <ItemPicker s={s} selected={selected} renderer={renderer} onSelect={onSelect} />
      </div>
      <div>
        <ItemDetail s={s} index={selected} send={null} />
        {item && (
          <ul className="rpg-forge">
            {forgeOptions(strings, s, item).map(option => (
              <li key={`${option.opcode}-${option.element}`} className="rpg-forge-row">
                <div className="rpg-forge-text">
                  <span className="rpg-node-name">{option.label}</span>
                  <span className="rpg-node-effect">
                    {option.after ? `${option.before} ${strings.arrow} ${option.after}` : option.before}
                  </span>
                  <span className="rpg-node-state">{option.cost}</span>
                </div>
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
    <ul className="rpg-forge">
      {melodies.map(melody => (
        <li key={melody} className="rpg-forge-row" data-wide={melody === MELODY_ROADS || undefined}>
          <div className="rpg-forge-text">
            <span className="rpg-node-name">{strings.melodyName[melody]}</span>
            <span className="rpg-node-effect">{strings.melodyEffect[melody]}</span>
          </div>
          {melody !== MELODY_ROADS ? (
            <button type="button" className="btn btn--primary play-btn rpg-node-btn" onClick={() => onHorn(hornArg(melody, 0))}>{strings.play}</button>
          ) : waystones.length === 0 ? (
            <span className="rpg-node-state">{strings.noWaystones}</span>
          ) : (
            <div className="rpg-row">
              {waystones.map(area => (
                <button key={area} type="button" className="btn btn--frame play-btn" onClick={() => onHorn(hornArg(MELODY_ROADS, area))}>
                  {strings.areaName[area]}
                </button>
              ))}
            </div>
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
        <div className="rpg-menu-head">
          <div className="rpg-tabs" role="tablist">
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
          <button ref={closeRef} type="button" className="btn btn--frame play-btn rpg-close" onClick={onClose}>
            {strings.close}
          </button>
        </div>
        <div id="rpg-tabpanel" role="tabpanel" aria-labelledby={`rpg-tab-${tab}`} className="rpg-tabpanel">
          {tab === 'gear' && <GearTab s={s} selected={selected} renderer={renderer} onSelect={setSelected} send={send} />}
          {tab === 'skills' && <SkillsTab s={s} send={send} />}
          {tab === 'forge' && (forgeOpen
            ? <ForgeTab s={s} selected={selected} renderer={renderer} onSelect={setSelected} send={send} />
            : <p className="rpg-empty">{strings.forgeAway}</p>)}
          {tab === 'horn' && <HornTab s={s} onHorn={onHorn} />}
        </div>
      </div>
    </div>
  )
}
