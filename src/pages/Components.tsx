import { useState } from 'react'
import { Container } from '@/components/layout'
import { Button, Input, Card } from '@/components/ui'

export function Components() {
  const [inputValue, setInputValue] = useState('')
  const [inputError, setInputError] = useState('')

  const validateEmail = (value: string) => {
    setInputValue(value)
    if (value && !value.includes('@')) {
      setInputError('Please enter a valid email address')
    } else {
      setInputError('')
    }
  }

  return (
    <Container>
      <header className="mb-16">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-px bg-gradient-to-r from-amber-500 to-transparent" />
          <span className="text-sm font-medium text-stone-500 uppercase tracking-wider">Design System</span>
        </div>
        
        <h1 className="text-4xl sm:text-5xl font-semibold text-stone-100 tracking-tight mb-6">
          Components
        </h1>

        <p className="text-lg text-stone-400 max-w-2xl leading-relaxed">
          A small but complete component library built for this portfolio. 
          Each component is designed with accessibility, composition, and 
          maintainability in mind.
        </p>
      </header>

      <div className="space-y-20">
        <ComponentSection
          title="Button"
          description="Buttons trigger actions. Use primary for the main action, secondary for alternatives, and ghost for low-emphasis actions."
        >
          <div className="space-y-8">
            <div>
              <h4 className="text-sm font-medium text-stone-400 mb-4">Variants</h4>
              <div className="flex flex-wrap gap-4">
                <Button>Primary</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="ghost">Ghost</Button>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-stone-400 mb-4">Sizes</h4>
              <div className="flex flex-wrap items-center gap-4">
                <Button size="default">Default Size</Button>
                <Button size="small">Small Size</Button>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-stone-400 mb-4">States</h4>
              <div className="flex flex-wrap gap-4">
                <Button disabled>Disabled</Button>
                <Button loading>Loading</Button>
              </div>
            </div>
          </div>
        </ComponentSection>

        <ComponentSection
          title="Input"
          description="Text input for forms. Labels are required for accessibility. Error and hint text are built-in."
        >
          <div className="space-y-6 max-w-md">
            <Input 
              label="Full name" 
              placeholder="Enter your name"
            />

            <Input 
              label="Email address" 
              type="email"
              placeholder="you@example.com"
              hint="We'll never share your email with anyone else."
            />

            <Input 
              label="Email with validation" 
              type="email"
              placeholder="you@example.com"
              value={inputValue}
              onChange={(e) => validateEmail(e.target.value)}
              error={inputError}
            />

            <Input 
              label="Disabled input" 
              value="readonly_user"
              disabled
            />

            <Input 
              label="Search" 
              placeholder="Search..."
              hideLabel
            />
          </div>
        </ComponentSection>

        <ComponentSection
          title="Card"
          description="Container for grouped content. Uses compound component pattern for flexible composition."
        >
          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <h4 className="text-sm font-medium text-stone-400 mb-4">Basic</h4>
              <Card>
                <Card.Body>
                  <p className="text-stone-400">Simple card with just a body.</p>
                </Card.Body>
              </Card>
            </div>

            <div>
              <h4 className="text-sm font-medium text-stone-400 mb-4">Interactive</h4>
              <Card interactive>
                <Card.Body>
                  <p className="text-stone-400">Hover to see the interactive state.</p>
                </Card.Body>
              </Card>
            </div>

            <div className="lg:col-span-2">
              <h4 className="text-sm font-medium text-stone-400 mb-4">With header and footer</h4>
              <Card className="max-w-md">
                <Card.Header>
                  <h3 className="font-medium text-stone-100">Card Title</h3>
                </Card.Header>
                <Card.Body>
                  <p className="text-stone-400">
                    Card content goes here. The header and footer are 
                    optional—use them when you need distinct sections.
                  </p>
                </Card.Body>
                <Card.Footer>
                  <div className="flex gap-3 justify-end">
                    <Button variant="ghost" size="small">Cancel</Button>
                    <Button size="small">Save</Button>
                  </div>
                </Card.Footer>
              </Card>
            </div>
          </div>
        </ComponentSection>
      </div>

      <section className="mt-24 pt-16 border-t border-stone-800">
        <div className="flex items-center gap-4 mb-12">
          <div className="w-12 h-px bg-gradient-to-r from-amber-500 to-transparent" />
          <h2 className="text-sm font-medium text-stone-500 uppercase tracking-wider">Design Principles</h2>
        </div>

        <div className="grid gap-8 sm:grid-cols-2">
          {[
            {
              title: 'Composition over configuration',
              description: 'Components expose building blocks, not extensive prop APIs. Card.Header + Card.Body is more flexible than headerTitle + headerSubtitle + showHeader props.',
            },
            {
              title: 'Accessible by default',
              description: 'Every component works with keyboard navigation and screen readers out of the box. Accessibility isn\'t an afterthought or an optional prop.',
            },
            {
              title: 'Minimal API surface',
              description: 'Start with the smallest API that solves the problem. It\'s easier to add props than to remove them. Every prop is documentation and maintenance burden.',
            },
            {
              title: 'Consistent patterns',
              description: 'All components accept className for customization. All interactive components forward refs. Predictability reduces cognitive load.',
            },
          ].map((principle) => (
            <div key={principle.title} className="p-6 rounded-2xl border border-stone-800 bg-stone-900/30">
              <h3 className="font-medium text-stone-100 mb-2">{principle.title}</h3>
              <p className="text-sm text-stone-500 leading-relaxed">
                {principle.description}
              </p>
            </div>
          ))}
        </div>
      </section>
    </Container>
  )
}

interface ComponentSectionProps {
  title: string
  description: string
  children: React.ReactNode
}

function ComponentSection({ title, description, children }: ComponentSectionProps) {
  return (
    <section>
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-stone-100 mb-2">{title}</h2>
        <p className="text-stone-500">{description}</p>
      </div>
      <div className="p-8 rounded-2xl border border-stone-800 bg-stone-900/30">
        {children}
      </div>
    </section>
  )
}
