import { Container } from '@/components/layout'

export function HowIWork() {
  return (
    <Container narrow>
      <header className="mb-16">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-px bg-gradient-to-r from-amber-500 to-transparent" />
          <span className="text-sm font-medium text-stone-500 uppercase tracking-wider">Approach</span>
        </div>
        
        <h1 className="text-4xl sm:text-5xl font-semibold text-stone-100 tracking-tight mb-6">
          How I Work
        </h1>

        <p className="text-lg text-stone-400 leading-relaxed">
          My approach to frontend architecture and development. Written for 
          technical collaborators who want to understand how I think about 
          building software.
        </p>
      </header>

      <article className="prose-content">
        <section>
          <h2>Frontend Architecture</h2>
          
          <p>
            I think of frontend architecture as the set of decisions that are 
            expensive to change later. Framework choice, state management 
            patterns, build tooling, component boundaries—these shape 
            everything that follows.
          </p>

          <p>
            My approach: start with the simplest thing that could work, 
            then add complexity only when there's clear evidence you need it. 
            Most applications don't need GraphQL. Most forms don't need a 
            form library. Most state doesn't need to be global.
          </p>

          <h3>Folder Structure</h3>
          <p>
            I organize by feature, not by type. Instead of having a 
            <code>components</code> folder with 200 files, I group related 
            code together:
          </p>

          <pre><code>{`src/
├── features/
│   ├── auth/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── api.ts
│   │   └── types.ts
│   └── dashboard/
│       ├── components/
│       └── ...
├── shared/
│   ├── components/
│   └── utils/
└── pages/`}</code></pre>

          <p>
            The goal is to make it obvious where code lives and to make 
            feature boundaries visible. When a feature is deleted, you 
            delete one folder.
          </p>
        </section>

        <section>
          <h2>Thinking About Abstractions</h2>
          
          <p>
            The hardest part of software development is choosing the right 
            abstractions. Too few, and you repeat yourself. Too many, and 
            you can't understand your own code.
          </p>

          <h3>The Rule of Three</h3>
          <p>
            I don't abstract on the first occurrence, or even the second. 
            When I see the same pattern three times, I understand it well 
            enough to abstract it correctly. Premature abstraction is worse 
            than duplication.
          </p>

          <h3>Abstraction Tests</h3>
          <p>Before creating an abstraction, I ask:</p>
          <ul>
            <li>Can I explain what this abstracts in one sentence?</li>
            <li>Does it hide complexity or just move it?</li>
            <li>Will the next developer understand when to use it?</li>
            <li>What happens when requirements change—does this make changes easier or harder?</li>
          </ul>

          <p>
            If I can't answer these confidently, the abstraction isn't ready.
          </p>
        </section>

        <section>
          <h2>State Management Philosophy</h2>
          
          <p>
            State management is the most over-complicated part of frontend 
            development. Here's how I think about it:
          </p>

          <h3>The State Hierarchy</h3>
          <p>Start with the simplest option that meets your needs:</p>
          <ul>
            <li><strong>URL state</strong> — If it should survive a refresh, put it in the URL</li>
            <li><strong>Local component state</strong> — For UI state that's only relevant to one component</li>
            <li><strong>Lifted state</strong> — When siblings need to share state, lift to the parent</li>
            <li><strong>Context</strong> — For state that genuinely needs to be global: auth, theme, feature flags</li>
            <li><strong>External store</strong> — Only when context updates cause performance problems</li>
          </ul>

          <h3>Server State is Different</h3>
          <p>
            Data from the server (API responses) has different concerns than 
            client state: caching, revalidation, loading states, error 
            handling. I use React Query or SWR for server state, not Redux 
            or Zustand.
          </p>
        </section>

        <section>
          <h2>Performance & Accessibility</h2>
          
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
        </section>

        <section>
          <h2>When I Keep Things Simple</h2>
          
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

          <h3>Framework Churn</h3>
          <p>
            I'm skeptical of the latest framework or paradigm. The JavaScript 
            ecosystem moves fast, but most projects are better served by 
            stable, well-understood tools than by chasing the cutting edge. 
            Innovation should happen in your product, not your build 
            system.
          </p>
        </section>

        <section>
          <h2>Working With Teams</h2>
          
          <p>
            Good architecture comes from good collaboration. Some practices 
            I've found valuable:
          </p>

          <ul>
            <li>
              <strong>Document decisions, not just implementations</strong> — 
              ADRs capture why we chose something, which is more valuable than what we chose
            </li>
            <li>
              <strong>Make implicit knowledge explicit</strong> — 
              If there's a "trick" to using a part of the codebase, that's a 
              sign it needs refactoring or documentation
            </li>
            <li>
              <strong>Prefer boring code</strong> — 
              Clever code is fun to write but expensive to maintain
            </li>
            <li>
              <strong>Small PRs, early feedback</strong> — 
              Large changes are hard to review well
            </li>
          </ul>
        </section>
      </article>
    </Container>
  )
}
