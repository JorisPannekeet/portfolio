import { useRef } from 'react'
import { useReveals } from '@/lib/motion'
import { content } from '@/data/content'
import { Sparkle } from '@/components/Sparkle'

export function About() {
  const scope = useRef<HTMLDivElement>(null)
  useReveals(scope)

  return (
    <div className="container" ref={scope}>
      <header className="page-head" data-reveal>
        <span className="stencil">PILOT DOSSIER // FULL RECORD</span>
        <h1>
          Building the web
          <br />
          <span style={{ color: 'var(--mauve-deep)' }}>for over a decade</span>
        </h1>
        <p>
          I'm a fullstack developer with around 11 years of experience. My expertise
          lies in developing efficient and scalable applications using React and
          TypeScript. I also have a strong background in design, HTML, CSS, WEB3,
          and game development.
        </p>
      </header>

      <div className="about-grid" style={{ paddingBottom: 40 }}>
        <article className="cut panel prose" data-reveal>
          <section>
            <h2>My Journey</h2>

            <p>
              Throughout my career, I've worked with a diverse range of clients and projects,
              ranging from small-scale startups to large enterprise-level corporations. My work
              has always been focused on creating dynamic and engaging user experiences, while
              ensuring high performance and accessibility standards.
            </p>

            <p>
              Currently, I'm a fullstack developer at Onesix. Before that, I spent over 7 years
              at Betty Blocks where I led and maintained a huge frontend codebase, built and
              deployed NPM packages and micro-services. I increased team performance by 20% by
              observing and acting on the team's needs.
            </p>

            <p>
              Earlier in my career, I spent 3 years at Nine Degrees, a web development agency
              where I gained full-stack experience and worked with various clients on diverse projects.
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
              When I'm not coding, you'll probably find spending time with my family, walking my
              dog Yoshi, riding motorcycle, playing games or watching movies. I believe balance is
              essential—the best ideas often come when you step away from the screen.
            </p>
          </section>

          <section>
            <h2>Let's Connect</h2>

            <p>
              I'm always interested in discussing new opportunities, especially those involving
              complex frontend challenges, team leadership, or building developer tools. The best
              way to reach me is via LinkedIn or my email.
            </p>
            <a href={`mailto:${content.links.email}`}>{content.links.email}</a>
          </section>
        </article>

        <aside className="about-aside" data-reveal-stagger>
          <div className="cut aside-panel">
            <h3><span className="stencil">SYS-01</span> Tech Stack</h3>
            {content.about.techStack.map((group) => (
              <div className="stack-group" key={group.category}>
                <span>{group.category}</span>
                <div>
                  {group.items.map((item) => <span className="chip" key={item}>{item}</span>)}
                </div>
              </div>
            ))}
          </div>

          <div className="cut aside-panel">
            <h3><span className="stencil">SYS-02</span> Beyond Work</h3>
            <ul className="passions">
              {content.about.passions.map((passion) => (
                <li key={passion.label}>
                  <span aria-hidden="true">{passion.emoji}</span>
                  {passion.label}
                </li>
              ))}
            </ul>
          </div>

          <div className="cut aside-panel aside-panel--alert">
            <Sparkle className="sparkle plate-corner-sparkle" />
            <h3>Open for opportunities</h3>
            <p>
              Looking for complex frontend challenges, team leadership roles or just a fun
              product to work on.
            </p>
            <p style={{ margin: '0 0 10px' }}>
              <a href={content.links.linkedin} target="_blank" rel="noopener noreferrer">
                Connect on LinkedIn ↗
              </a>
            </p>
            <p style={{ margin: 0 }}>
              <a href={`mailto:${content.links.email}`}>{content.links.email}</a>
            </p>
          </div>
        </aside>
      </div>
    </div>
  )
}
