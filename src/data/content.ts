// All written site copy lives here, separated from the visual layer.
// Extracted 1:1 from the previous site (see content.json audit); only the
// role title changed to "Senior Fullstack Engineer" per owner request.

export const content = {
  links: {
    github: 'https://github.com/JorisPannekeet',
    linkedin: 'https://www.linkedin.com/in/joris-pannekeet-75ba4130/',
    email: 'jorispannekeet@gmail.com',
  },

  hero: {
    greeting: 'My name is Joris',
    role: 'Senior Fullstack Engineer',
    intro:
      '11 years crafting digital experiences. I specialize in building efficient, scalable applications with React and TypeScript. Experience in UX/UI design, large scale projects, Ai integrations, WEB3, and game development.',
    ctaPrimary: 'View my work',
    ctaSecondary: 'About me',
  },

  skills: [
    { name: 'React', years: 8 },
    { name: 'TypeScript', years: 6 },
    { name: 'Node.js', years: 7 },
    { name: 'Tailwind', years: 4 },
  ],

  experience: [
    { role: 'Fullstack Developer', company: 'Onesix', period: 'May 2026 — Present', type: 'Agency' },
    { role: 'Frontend Developer', company: 'Betty Blocks', period: '2018 — April 2026', type: 'SaaS' },
    { role: 'Fullstack Developer', company: 'Nine Degrees', period: '2015 — 2017', type: 'Agency' },
  ],

  approach: [
    {
      title: 'Pragmatic Solutions',
      text: 'I prefer mature, well-understood tools over exciting new ones. Innovation should happen in your product, not your infrastructure.',
    },
    {
      title: 'Performance First',
      text: "I've improved team performance by 20% by observing and acting on real needs. Every decision has performance implications.",
    },
    {
      title: 'Team Leadership',
      text: 'I lead and maintain large codebases, build NPM packages and micro-services. Good architecture comes from good collaboration.',
    },
  ],

  caseStudiesIntro:
    "Detailed breakdowns of projects I've worked on. Each case study includes context, constraints, architectural decisions, and honest discussion of trade-offs.",

  codeDisclaimer:
    'Disclaimer: These examples are simplified and do not reflect the actual codebase.',

  about: {
    techStack: [
      { category: 'Core', items: ['React', 'TypeScript', 'JavaScript', 'HTML', 'CSS'] },
      { category: 'Styling', items: ['Tailwind', 'Styled Components', 'CSS Modules'] },
      { category: 'State', items: ['Redux', 'Zustand', 'React Query'] },
      { category: 'Tools', items: ['Git', 'NPM', 'Jest', 'Node.js'] },
    ],
    passions: [
      { emoji: '👶', label: 'Being a father' },
      { emoji: '🐕', label: 'Yoshi (my dog)' },
      { emoji: '🏍️', label: 'Motorcycles & cars' },
      { emoji: '🎮', label: 'Games & movies' },
      { emoji: '💪', label: 'Working out' },
    ],
  },
} as const
