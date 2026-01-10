import { Container } from './Container'

const externalLinks = [
  { href: 'https://github.com/JorisPannekeet', label: 'GitHub' },
  { href: 'https://www.linkedin.com/in/joris-pannekeet-75ba4130/', label: 'LinkedIn' },
  { href: 'mailto:jorispannekeet@gmail.com', label: 'Email' },
] as const

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="relative border-t border-stone-800/50 bg-stone-950">
      <Container>
        <div className="flex flex-col gap-4 py-8 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-4 items-center">
            <div className="flex justify-center items-center w-6 h-6 text-xs font-bold bg-gradient-to-br from-amber-400 to-amber-600 rounded text-stone-950">
              JP
            </div>
            <p className="text-sm text-stone-500">
              © {currentYear} · Built with React, TypeScript & Tailwind
            </p>
          </div>

          <ul className="flex gap-4 items-center">
            {externalLinks.map(({ href, label }) => (
              <li key={href}>
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm transition-colors text-stone-500 hover:text-amber-400"
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
