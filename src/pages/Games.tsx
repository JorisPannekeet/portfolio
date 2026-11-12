import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { useMechanics } from '@/lib/mech'
import { content } from '@/data/content'
import { Module } from '@/components/Module'

export function Games() {
  const scope = useRef<HTMLDivElement>(null)
  useMechanics(scope)

  return (
    <div className="container stack stack--tight" ref={scope}>
      <Module as="header" entry="drop" decal="SIM BAY // PLAYABLE" vent className="page-head">
        <h1>Games</h1>
        <p>Games I've built, all playable in your browser.</p>
      </Module>

      <div className="bay__stack">
        {content.games.map((game, i) => (
          <Module
            as="article"
            key={game.href}
            entry={i % 2 ? 'right' : 'left'}
            tone="frame"
            hatch="split"
            stencil={game.title}
            className="case project press"
          >
            <div>
              <div className="case__meta">
                <span className="decal">SIM-{String(i + 1).padStart(2, '0')}</span>
              </div>
              <h2 className="case__title">
                {game.href.startsWith('http') ? (
                  <a href={game.href} target="_blank" rel="noreferrer" className="case__link">{game.title} ↗</a>
                ) : (
                  <Link to={game.href} className="case__link">{game.title} →</Link>
                )}
              </h2>
              <p className="case__summary">{game.pitch}</p>
              <div className="tags">
                {game.tags.map((tag) => (
                  <span className="chip" key={tag}>{tag}</span>
                ))}
              </div>
            </div>
            <img className="project__shot" src={game.image} alt="" width={1280} height={720} loading="lazy" />
          </Module>
        ))}
      </div>
    </div>
  )
}
