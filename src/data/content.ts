// All written site copy lives here, separated from the visual layer.
// Extracted 1:1 from the previous site (see content.json audit); only the
// role title changed to "Senior Fullstack Engineer" per owner request.

export const content = {
  links: {
    github: 'https://github.com/JorisPannekeet',
    linkedin: 'https://www.linkedin.com/in/joris-pannekeet-75ba4130/',
    x: 'https://x.com/pindakaaspeer',
    email: 'jorispannekeet@gmail.com',
  },

  hero: {
    greeting: "Hi, I'm Joris",
    role: 'Senior Fullstack Engineer',
    intro:
      '12 years crafting digital experiences. I specialize in building efficient, scalable applications. Experience in UX/UI design, large scale projects, Ai integrations, WEB3, mobile and game development.',
    ctaPrimary: 'View my work',
    ctaSecondary: 'About me',
  },

  skillTabs: [
    {
      label: 'Post Ai',
      skills: [
        { name: 'Agent Skills', years: 1 },
        { name: 'MCPs', years: 2 },
        { name: 'Agent Dev', years: 3 },
        { name: 'Automation', years: 3 },
      ],
    },
    {
      label: 'Pre Ai',
      skills: [
        { name: 'React', years: 8 },
        { name: 'TypeScript', years: 6 },
        { name: 'Node.js', years: 7 },
        { name: 'Tailwind', years: 4 },
      ],
    },
  ],

  // Experience items now come from the structured data source in data/experience_items.json
  experience: [],

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

  projects: [
    {
      title: 'AI-First CMS',
      pitch: 'A CMS where clients manage the content and data of their websites by asking an AI. This portfolio runs on it.',
      tags: ['AI Agents', 'CMS', 'Fullstack'],
      url: 'https://app.redflake.nl',
      image: '/projects/cms.jpg',
    },
    {
      title: 'Redflake',
      pitch: 'An MCP service that gives AI agents read-only access to your bank accounts. Ask Claude or ChatGPT where your money goes.',
      tags: ['MCP', 'Agents', 'Open Banking', 'Automations'],
      url: 'https://redflake.nl',
      image: '/projects/redflake.jpg',
    },
    {
      title: 'OTH Architects',
      pitch: 'A scroll-animated website for an architecture firm, built around large imagery and motion.',
      tags: ['Scroll Animation', 'Motion', 'Frontend'],
      url: 'https://oth-gold.vercel.app',
      image: '/projects/oth.jpg',
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
      { label: 'Being a father' },
      { label: 'Yoshi (my dog)' },
      { label: 'Motorcycles & cars' },
      { label: 'Games & movies' },
      { label: 'Working out' },
    ],
  },
} as const
