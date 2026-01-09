import { Link } from 'react-router-dom'
import { Container } from '@/components/layout'
import { Card } from '@/components/ui'
import { caseStudies } from '@/data/caseStudies'

const skills = [
  { name: 'React', years: 8 },
  { name: 'TypeScript', years: 6 },
  { name: 'Node.js', years: 7 },
  { name: 'Tailwind', years: 4 },
]

const experience = [
  {
    role: 'Frontend Developer',
    company: 'Betty Blocks',
    period: '2018 — Present',
    type: 'SaaS',
  },
  {
    role: 'Fullstack Developer',
    company: 'Nine Degrees',
    period: '2015 — 2017',
    type: 'Agency',
  },
]

export function Home() {
  const featuredStudies = caseStudies.slice(0, 2)

  return (
    <Container>
      <section className="min-h-[70vh] flex items-center py-12">
        <div className="grid lg:grid-cols-[1fr,400px] gap-12 lg:gap-16 items-center w-full">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse-slow" />
                Available for opportunities
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold text-stone-100 tracking-tight leading-tight">
              Hi, I'm <span className="text-amber-400">Joris</span>
              <br />
              <span className="text-stone-400">Senior Frontend Developer</span>
            </h1>
            <span className="text-lg text-stone-600 italic align-middle font-normal">
              With some backend experience as well.
            </span>
            
            <p className="mt-6 text-lg sm:text-xl text-stone-400 max-w-2xl leading-relaxed">
              11 years crafting digital experiences. I specialize in building 
              efficient, scalable applications with React and TypeScript. 
              Experience in UX/UI design, large scale projects, Ai integrations, WEB3, and game development.
            </p>

            <div className="mt-10 flex flex-wrap gap-4">
              <Link 
                to="/case-studies"
                className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 hover:from-amber-400 hover:to-amber-500 transition-all shadow-lg shadow-amber-500/20"
              >
                View my work
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
              <Link 
                to="/about"
                className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium rounded-xl border border-stone-700 text-stone-300 hover:bg-stone-800/50 hover:border-stone-600 transition-all"
              >
                About me
              </Link>
            </div>

            <div className="mt-16 flex flex-wrap gap-6">
              {skills.map((skill) => (
                <div key={skill.name} className="flex items-center gap-2">
                  <span className="text-stone-200 font-medium">{skill.name}</span>
                  <span className="text-stone-600 text-sm">{skill.years}y</span>
                </div>
              ))}
            </div>
          </div>

          <div className="hidden lg:block relative">
            <div className="absolute -inset-4 bg-gradient-to-br from-amber-500/20 via-transparent to-violet-500/20 rounded-3xl blur-2xl" />
            <div className="relative aspect-[3/4] rounded-2xl overflow-hidden border border-stone-800 shadow-2xl shadow-stone-950/50">
              <img 
                src="/me.jpeg" 
                alt="Joris Pannekeet" 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-stone-950/60 via-transparent to-transparent" />
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 border-t border-stone-800/50">
        <div className="flex items-center gap-4 mb-12">
          <div className="w-12 h-px bg-gradient-to-r from-amber-500 to-transparent" />
          <h2 className="text-sm font-medium text-stone-500 uppercase tracking-wider">Experience</h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {experience.map((exp) => (
            <Card key={exp.company}>
              <Card.Body>
                <div className="flex items-start justify-between mb-3">
                  <span className="px-2 py-0.5 text-xs font-medium rounded bg-stone-800 text-stone-400">
                    {exp.type}
                  </span>
                  <span className="text-sm text-stone-500">{exp.period}</span>
                </div>
                <h3 className="text-lg font-medium text-stone-100">{exp.role}</h3>
                <p className="text-stone-400">{exp.company}</p>
              </Card.Body>
            </Card>
          ))}
        </div>
      </section>

      <section className="py-20 border-t border-stone-800/50">
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-4">
            <div className="w-12 h-px bg-gradient-to-r from-amber-500 to-transparent" />
            <h2 className="text-sm font-medium text-stone-500 uppercase tracking-wider">Selected Work</h2>
          </div>
          <Link 
            to="/case-studies"
            className="text-sm text-stone-500 hover:text-amber-400 transition-colors"
          >
            View all →
          </Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {featuredStudies.map((study, index) => (
            <Link 
              key={study.slug} 
              to={`/case-studies/${study.slug}`}
              className="group block"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <Card interactive className="h-full">
                <Card.Body className="p-8">
                  <div className="flex items-center gap-2 text-sm text-stone-500 mb-4">
                    <span className="text-amber-500">{study.company}</span>
                    <span>·</span>
                    <span>{study.year}</span>
                  </div>
                  
                  <h3 className="text-xl font-medium text-stone-100 group-hover:text-amber-400 transition-colors mb-3">
                    {study.title}
                  </h3>
                  
                  <p className="text-stone-400 line-clamp-2 mb-6">
                    {study.subtitle}
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {study.tags.map((tag) => (
                      <span 
                        key={tag}
                        className="px-2.5 py-1 rounded-lg bg-stone-800/50 text-xs font-medium text-stone-400 border border-stone-800"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </Card.Body>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      <section className="py-20 border-t border-stone-800/50">
        <div className="flex items-center gap-4 mb-12">
          <div className="w-12 h-px bg-gradient-to-r from-amber-500 to-transparent" />
          <h2 className="text-sm font-medium text-stone-500 uppercase tracking-wider">My Approach</h2>
        </div>
        
        <div className="grid gap-8 sm:grid-cols-3">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h3 className="font-medium text-stone-100">Pragmatic Solutions</h3>
            <p className="text-stone-400 text-sm leading-relaxed">
              I prefer mature, well-understood tools over exciting new ones. 
              Innovation should happen in your product, not your infrastructure.
            </p>
          </div>
          
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="font-medium text-stone-100">Performance First</h3>
            <p className="text-stone-400 text-sm leading-relaxed">
              I've improved team performance by 20% by observing and acting on 
              real needs. Every decision has performance implications.
            </p>
          </div>
          
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="font-medium text-stone-100">Team Leadership</h3>
            <p className="text-stone-400 text-sm leading-relaxed">
              I lead and maintain large codebases, build NPM packages and 
              micro-services. Good architecture comes from good collaboration.
            </p>
          </div>
        </div>
      </section>
    </Container>
  )
}
