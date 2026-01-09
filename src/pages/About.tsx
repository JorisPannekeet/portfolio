import { Container } from '@/components/layout'

const techStack = [
  { category: 'Core', items: ['React', 'TypeScript', 'JavaScript', 'HTML', 'CSS'] },
  { category: 'Styling', items: ['Tailwind', 'Styled Components', 'CSS Modules'] },
  { category: 'State', items: ['Redux', 'Zustand', 'React Query'] },
  { category: 'Tools', items: ['Git', 'NPM', 'Jest', 'Node.js'] },
]

const passions = [
  { emoji: '🐕', label: 'Yoshi (my dog)' },
  { emoji: '🏍️', label: 'Motorcycles & cars' },
  { emoji: '🎮', label: 'Games & movies' },
  { emoji: '💪', label: 'Working out' },
]

export function About() {
  return (
    <Container>
      <div className="grid lg:grid-cols-[1fr,320px] gap-16 lg:gap-24">
        <article className="prose-content">
          <header className="mb-16">
            <div className="flex gap-4 items-center mb-6">
              <div className="w-12 h-px bg-gradient-to-r from-amber-500 to-transparent" />
              <span className="text-sm font-medium tracking-wider uppercase text-stone-500">About</span>
            </div>
            
            <h1 className="mb-6 text-4xl font-semibold tracking-tight sm:text-5xl text-stone-100">
              Building the web
              <br />
              <span className="text-stone-500">for over a decade</span>
            </h1>

            <p className="max-w-2xl text-lg leading-relaxed text-stone-400">
              I'm a frontend developer with around 11 years of experience. My expertise 
              lies in developing efficient and scalable applications using React and 
              TypeScript. I also have a strong background in design, HTML, CSS, WEB3, 
              and game development.
            </p>
          </header>

          <section>
            <h2>My Journey</h2>
            
            <p>
              Throughout my career, I've worked with a diverse range of clients and projects, 
              ranging from small-scale startups to large enterprise-level corporations. My work 
              has always been focused on creating dynamic and engaging user experiences, while 
              ensuring high performance and accessibility standards.
            </p>

            <p>
              Currently, I'm at Betty Blocks where I lead and maintain a huge frontend codebase, 
              build and deploy NPM packages and micro-services. I've increased team performance 
              by 20% by observing and acting on the team's needs.
            </p>

            <p>
              Before that, I spent 3 years at Nine Degrees, a web development agency where I 
              gained full-stack experience and worked with various clients on diverse projects.
            </p>
          </section>

          <section>
            <h2>What Drives Me</h2>
            
            <p>
              My passion for technology and innovation has driven me to constantly learn and 
              evolve, staying up-to-date with the latest trends and best practices in the industry. 
              As a result, I am able to offer cutting-edge solutions that are tailored to unique needs.
            </p>

            <p>
              I believe the best code is often the code you don't write. I focus on solving real 
              problems for real users, choosing pragmatic solutions over exciting new technology 
              for its own sake.
            </p>
          </section>

          <section>
            <h2>Beyond Code</h2>
            
            <p>
              When I'm not coding, you'll probably find me walking my dog Yoshi, riding motorcycles, 
              playing games, watching movies, or at the gym. I believe balance is essential—the best 
              ideas often come when you step away from the screen.
            </p>
          </section>

          <section>
            <h2>Let's Connect</h2>
            
            <p>
              I'm always interested in discussing new opportunities, especially those involving 
              complex frontend challenges, team leadership, or building developer tools. The best 
              way to reach me is via LinkedIn or GitHub.
            </p>
          </section>
        </article>

        <aside className="space-y-8 lg:sticky lg:top-24 lg:self-start">
          <div className="p-6 rounded-2xl border border-stone-800 bg-stone-900/30">
            <h3 className="mb-4 text-sm font-medium tracking-wider uppercase text-stone-500">
              Tech Stack
            </h3>
            <div className="space-y-4">
              {techStack.map((group) => (
                <div key={group.category}>
                  <span className="block mb-2 text-xs text-stone-600">{group.category}</span>
                  <div className="flex flex-wrap gap-1.5">
                    {group.items.map((item) => (
                      <span 
                        key={item}
                        className="px-2 py-1 text-xs rounded-md border bg-stone-800/50 text-stone-400 border-stone-800"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-6 rounded-2xl border border-stone-800 bg-stone-900/30">
            <h3 className="mb-4 text-sm font-medium tracking-wider uppercase text-stone-500">
              Beyond Work
            </h3>
            <div className="space-y-3">
              {passions.map((passion) => (
                <div key={passion.label} className="flex gap-3 items-center">
                  <span className="text-lg">{passion.emoji}</span>
                  <span className="text-sm text-stone-400">{passion.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="p-6 bg-gradient-to-br rounded-2xl border from-amber-500/10 to-amber-600/5 border-amber-500/20">
            <h3 className="mb-3 text-sm font-medium text-amber-400">
              Open for opportunities
            </h3>
            <p className="mb-4 text-sm text-stone-400">
              Looking for complex frontend challenges and team leadership roles.
            </p>
            <a 
              href="https://www.linkedin.com/in/joris-pannekeet-75ba4130/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex gap-2 items-center text-sm font-medium text-amber-400 transition-colors hover:text-amber-300"
            >
              Connect on LinkedIn
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
        </aside>
      </div>
    </Container>
  )
}
