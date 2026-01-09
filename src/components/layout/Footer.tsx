import { Container } from './Container'

const externalLinks = [
  { href: 'https://github.com', label: 'GitHub' },
  { href: 'https://linkedin.com', label: 'LinkedIn' },
] as const

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t border-stone-800/50 bg-stone-950">
      <Container>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-8 gap-4">
          <div className="flex items-center gap-4">
            <div className="w-6 h-6 rounded bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-stone-950 font-bold text-xs">
              JP
            </div>
            <p className="text-sm text-stone-500">
              © {currentYear} · Built with React, TypeScript & Tailwind
            </p>
          </div>

          <ul className="flex items-center gap-4">
            {externalLinks.map(({ href, label }) => (
              <li key={href}>
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-stone-500 hover:text-amber-400 transition-colors"
                >
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </footer>
  )
}
