import { useRef } from 'react'
import { useMechanics } from '@/lib/mech'
import { Module } from '@/components/Module'

export function HowIWork() {
  const scope = useRef<HTMLDivElement>(null)
  useMechanics(scope)

  return (
    <div className="container container--narrow stack stack--tight" ref={scope}>
      <Module as="header" entry="drop" decal="FIELD MANUAL // OPERATING DOCTRINE" vent className="page-head">
        <h1>How I Work</h1>
        <p>
          How I build software as a fullstack engineer in the agentic era.
          Written for technical collaborators who want to understand how I
          think, and how I get reliable output from AI agents.
        </p>
      </Module>

      <article className="manual stack stack--tight">
        <Module title="Working With Agents" entry="left" decal="SEC-01 // AGENT CONTROL" className="prose">
          <p>
            Agents write most of the code now. My job is making sure that
            code is right. Twelve years of development is what lets me
            instruct agents well: I know what to ask for, what to watch out
            for and what they should never do.
          </p>

          <h3>The Right Tool for the Task</h3>
          <p>
            I know a wide range of skills and MCP servers and when each one
            fits the task at hand. Giving an agent the right tools and
            context matters more than the prompt itself.
          </p>

          <h3>The Right Model for the Job</h3>
          <p>
            Models have different strengths, so I split the work. For
            example, I let Fable write a detailed plan and let Opus execute
            it. Planning and execution are different jobs.
          </p>

          <h3>Trust by Design</h3>
          <p>
            The most important part is the environment, not the agent. I set
            up an agentic environment where the output can be trusted:
          </p>
          <ul>
            <li><strong>Self-review</strong> — agents check their own work before handing it off</li>
            <li><strong>Self-validation</strong> — every change is proven with tests, builds and real runs</li>
            <li><strong>Self-improvement</strong> — lessons from mistakes feed back into the setup, so they don't repeat</li>
          </ul>

          <h3>Independent Review</h3>
          <p>
            The model that wrote the code doesn't review it. I use a
            different model, such as Codex, for pull request reviews, so
            blind spots don't get approved by the same mind that created
            them.
          </p>
        </Module>

        <Module title="Architecture" entry="right" decal="SEC-02 // FRAME LAYOUT" className="prose">
          <p>
            I think of architecture as the set of decisions that are
            expensive to change later. I start with the simplest thing that
            could work and add complexity only when there's clear evidence
            it's needed.
          </p>

          <ul>
            <li><strong>Organize by feature, not by type</strong> — when a feature is deleted, you delete one folder</li>
            <li><strong>Keep state as local as possible</strong> — URL, then component, then lifted, then context, and an external store only when needed</li>
            <li><strong>Server state is different</strong> — caching and revalidation belong in a tool like React Query, not in a global store</li>
          </ul>
        </Module>

        <Module title="Performance & Accessibility" entry="left" decal="SEC-03 // OUTPUT TUNING" className="prose">
          <h3>Performance</h3>
          <p>
            Performance optimization starts with measurement. I use Core
            Web Vitals as a baseline, but the real test is: does the app
            feel fast to users?
          </p>

          <p>My performance checklist:</p>
          <ul>
            <li>Code-split at route boundaries (minimum)</li>
            <li>Lazy-load images and below-fold content</li>
            <li>Avoid layout shift (reserve space for async content)</li>
            <li>Profile before optimizing (don't guess at bottlenecks)</li>
            <li>Set performance budgets and measure against them</li>
          </ul>

          <h3>Accessibility</h3>
          <p>
            Accessibility isn't a feature, it's a quality bar. I build
            accessible by default:
          </p>
          <ul>
            <li>Semantic HTML first (buttons are buttons, not divs)</li>
            <li>Keyboard navigation for all interactive elements</li>
            <li>Visible focus states (don't remove outlines, restyle them)</li>
            <li>Color contrast that meets WCAG AA</li>
            <li>Labels for all form inputs (visible or via aria-label)</li>
          </ul>
        </Module>

        <Module title="When I Keep Things Simple" entry="right" decal="SEC-04 // RESTRAINT" className="prose">
          <p>
            Senior engineering often means knowing what not to do. Some
            situations where I deliberately choose simpler solutions:
          </p>

          <h3>Don't Need That Library</h3>
          <ul>
            <li><strong>Form library for a login form</strong> — Controlled inputs are fine</li>
            <li><strong>State management for a content site</strong> — URL + useState covers most needs</li>
            <li><strong>Animation library for hover effects</strong> — CSS transitions work great</li>
            <li><strong>Date library for displaying dates</strong> — Intl.DateTimeFormat is built in</li>
          </ul>

          <h3>The Rewrite Question</h3>
          <p>
            When someone proposes a rewrite, I ask: what specific problems
            will this solve that targeted improvements won't? Rewrites are
            expensive and risky. Usually, incremental improvement is both
            safer and faster to deliver value.
          </p>

          <h3>Proven Over Hyped</h3>
          <p>
            I'm skeptical of hype, not of change. Most projects are better
            served by stable, well-understood tools than by chasing the
            latest framework. I adopted agents because they proved
            themselves on real work, not because they were new.
          </p>
        </Module>

        <Module title="Working With Teams" entry="left" decal="SEC-05 // SQUAD OPS" className="prose">
          <p>
            Good architecture comes from good collaboration. Some practices
            I've found valuable:
          </p>

          <ul>
            <li>
              <strong>Document decisions, not just implementations</strong> —{' '}
              ADRs capture why we chose something, which is more valuable than what we chose
            </li>
            <li>
              <strong>Make implicit knowledge explicit</strong> —{' '}
              If there's a "trick" to using a part of the codebase, that's a
              sign it needs refactoring or documentation
            </li>
            <li>
              <strong>Write it down for humans and agents</strong> —{' '}
              Good documentation is now context for agents too, and it
              directly improves their output
            </li>
            <li>
              <strong>Prefer boring code</strong> —{' '}
              Clever code is fun to write but expensive to maintain
            </li>
            <li>
              <strong>Small PRs, early feedback</strong> —{' '}
              Large changes are hard to review well
            </li>
          </ul>
        </Module>
      </article>
    </div>
  )
}
