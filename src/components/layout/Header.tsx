import { Link, NavLink } from 'react-router-dom'
import { Container } from './Container'

const navItems = [
  { to: '/case-studies', label: 'Work' },
  { to: '/how-i-work', label: 'Approach' },
  { to: '/components', label: 'Components' },
  { to: '/about', label: 'About' },
] as const

export function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-stone-800/50 bg-stone-950/80 backdrop-blur-xl">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-stone-900 focus:px-4 focus:py-2 focus:text-amber-400"
      >
        Skip to main content
      </a>

      <Container>
        <nav className="flex h-16 items-center justify-between">
          <Link 
            to="/" 
            className="group flex items-center gap-2"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-stone-950 font-bold text-sm">
              JP
            </div>
            <span className="text-stone-100 font-medium hidden sm:block group-hover:text-amber-400 transition-colors">
              Joris Pannekeet
            </span>
          </Link>

          <ul className="flex items-center gap-1">
            {navItems.map(({ to, label }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  className={({ isActive }) => [
                    'px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200',
                    isActive 
                      ? 'text-amber-400 bg-amber-500/10' 
                      : 'text-stone-400 hover:text-stone-100 hover:bg-stone-800/50',
                  ].join(' ')}
                >
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </Container>
    </header>
  )
}
