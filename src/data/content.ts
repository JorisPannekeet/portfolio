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

  games: [
    {
      title: 'Mech Survivors',
      pitch: 'Pilot Unit JP-12 through an eight-minute sortie against endless waves. Pick upgrades, capture beacons, survive.',
      tags: ['Survivors-like', 'Canvas', 'Chiptune'],
      href: '/play',
      image: '/games/mech-survivors.jpg',
    },
    {
      title: 'Shards of the Fourfold Crown',
      pitch: 'An action-RPG across the land of Valdmere. Gather four Shards, forge the Crown and make a choice at the end.',
      tags: ['Action RPG', 'Canvas', 'Story'],
      href: '/rpg',
      image: '/games/shards-fourfold-crown.jpg',
    },
    {
      title: 'Downfall',
      pitch: 'A dungeon crawler card game. Fight your way down through the dungeon one card at a time.',
      tags: ['Card Game', 'Dungeon Crawler'],
      href: 'https://hellstar.vercel.app/',
      image: '/games/downfall.jpg',
    },
  ],

  about: {
    passions: [
      { label: 'Being a father' },
      { label: 'Yoshi (my dog)' },
      { label: 'Motorcycles & cars' },
      { label: 'Games & movies' },
      { label: 'Working out' },
    ],
    story: [
      {
        key: 'intro',
        title: 'Building the web for over a decade',
        body: [
          { kind: 'p', text: "I'm a fullstack developer with around 12 years of experience. My expertise lies in developing efficient and scalable applications using React and TypeScript. I also have a strong background in design, HTML, CSS, WEB3, and game development." },
        ],
      },
      {
        key: 'journey',
        title: 'My Journey',
        body: [
          { kind: 'p', text: "Throughout my career, I've worked with a diverse range of clients and projects, ranging from small-scale startups to large enterprise-level corporations. My work has always been focused on creating dynamic and engaging user experiences, while ensuring high performance and accessibility standards." },
          { kind: 'p', text: "Currently, I'm a fullstack developer at Onesix, where I merged around 370 pull requests in my first six months. Next to Belgian fiscal compliance, AI features and inventory management, I automated billing and collections across four providers and overhauled the Kiosk experience with a no-code theme editor and allergen filters." },
          { kind: 'p', text: "Before that, I spent over 7 years at Betty Blocks where I led and maintained a huge frontend codebase, built and deployed NPM packages and micro-services. I increased team performance by 20% by observing and acting on the team's needs." },
          { kind: 'p', text: 'Earlier in my career, I spent 3 years at Nine Degrees, a web development agency where I gained full-stack experience and worked with various clients on diverse projects.' },
        ],
      },
      {
        key: 'drives',
        title: 'What Drives Me',
        body: [
          { kind: 'p', text: 'My passion for technology and innovation has driven me to constantly learn and evolve, staying up-to-date with the latest trends and best practices in the industry. As a result, I am able to offer cutting-edge solutions that are tailored to unique needs.' },
          { kind: 'p', text: "I believe the best code is often the code you don't write. I focus on solving real problems for real users, choosing pragmatic solutions over exciting new technology for its own sake." },
        ],
      },
      {
        key: 'beyond',
        title: 'Beyond Code',
        body: [
          { kind: 'p', text: "When I'm not coding, you'll probably find spending time with my family, walking my dog Yoshi, riding motorcycle, playing games or watching movies. I believe balance is essential—the best ideas often come when you step away from the screen." },
        ],
      },
    ],
    connect: {
      title: "Let's Connect",
      body: [
        { kind: 'p', text: "I'm always interested in discussing new opportunities, especially those involving complex frontend challenges, team leadership, or building developer tools. The best way to reach me is via LinkedIn or my email." },
      ],
    },
  },

  gamesIntro: "Games I've built, all playable in your browser.",

  howIWork: [
    {
      key: 'intro',
      title: 'How I Work',
      body: [
        { kind: 'p', text: 'How I build software as a fullstack engineer in the agentic era. Written for technical collaborators who want to understand how I think, and how I get reliable output from AI agents.' },
      ],
    },
    {
      key: 'agents',
      title: 'Working With Agents',
      body: [
        { kind: 'p', text: 'Agents write most of the code now. My job is making sure that code is right. Twelve years of development is what lets me instruct agents well: I know what to ask for, what to watch out for and what they should never do.' },
        { kind: 'h3', text: 'The Right Tool for the Task' },
        { kind: 'p', text: 'I know a wide range of skills and MCP servers and when each one fits the task at hand. Giving an agent the right tools and context matters more than the prompt itself.' },
        { kind: 'h3', text: 'The Right Model for the Job' },
        { kind: 'p', text: 'Models have different strengths, so I split the work. For example, I let Fable write a detailed plan and let Opus execute it. Planning and execution are different jobs.' },
        { kind: 'h3', text: 'Trust by Design' },
        { kind: 'p', text: 'The most important part is the environment, not the agent. I set up an agentic environment where the output can be trusted:' },
        {
          kind: 'ul',
          items: [
            { lead: 'Self-review', text: 'agents check their own work before handing it off' },
            { lead: 'Self-validation', text: 'every change is proven with tests, builds and real runs' },
            { lead: 'Self-improvement', text: "lessons from mistakes feed back into the setup, so they don't repeat" },
          ],
        },
        { kind: 'h3', text: 'Independent Review' },
        { kind: 'p', text: "The model that wrote the code doesn't review it. I use a different model, such as Codex, for pull request reviews, so blind spots don't get approved by the same mind that created them." },
      ],
    },
    {
      key: 'architecture',
      title: 'Architecture',
      body: [
        { kind: 'p', text: "I think of architecture as the set of decisions that are expensive to change later. I start with the simplest thing that could work and add complexity only when there's clear evidence it's needed." },
        {
          kind: 'ul',
          items: [
            { lead: 'Organize by feature, not by type', text: 'when a feature is deleted, you delete one folder' },
            { lead: 'Keep state as local as possible', text: 'URL, then component, then lifted, then context, and an external store only when needed' },
            { lead: 'Server state is different', text: 'caching and revalidation belong in a tool like React Query, not in a global store' },
          ],
        },
      ],
    },
    {
      key: 'performance',
      title: 'Performance & Accessibility',
      body: [
        { kind: 'h3', text: 'Performance' },
        { kind: 'p', text: 'Performance optimization starts with measurement. I use Core Web Vitals as a baseline, but the real test is: does the app feel fast to users?' },
        { kind: 'p', text: 'My performance checklist:' },
        {
          kind: 'ul',
          items: [
            { text: 'Code-split at route boundaries (minimum)' },
            { text: 'Lazy-load images and below-fold content' },
            { text: 'Avoid layout shift (reserve space for async content)' },
            { text: "Profile before optimizing (don't guess at bottlenecks)" },
            { text: 'Set performance budgets and measure against them' },
          ],
        },
        { kind: 'h3', text: 'Accessibility' },
        { kind: 'p', text: "Accessibility isn't a feature, it's a quality bar. I build accessible by default:" },
        {
          kind: 'ul',
          items: [
            { text: 'Semantic HTML first (buttons are buttons, not divs)' },
            { text: 'Keyboard navigation for all interactive elements' },
            { text: "Visible focus states (don't remove outlines, restyle them)" },
            { text: 'Color contrast that meets WCAG AA' },
            { text: 'Labels for all form inputs (visible or via aria-label)' },
          ],
        },
      ],
    },
    {
      key: 'simple',
      title: 'When I Keep Things Simple',
      body: [
        { kind: 'p', text: 'Senior engineering often means knowing what not to do. Some situations where I deliberately choose simpler solutions:' },
        { kind: 'h3', text: "Don't Need That Library" },
        {
          kind: 'ul',
          items: [
            { lead: 'Form library for a login form', text: 'Controlled inputs are fine' },
            { lead: 'State management for a content site', text: 'URL + useState covers most needs' },
            { lead: 'Animation library for hover effects', text: 'CSS transitions work great' },
            { lead: 'Date library for displaying dates', text: 'Intl.DateTimeFormat is built in' },
          ],
        },
        { kind: 'h3', text: 'The Rewrite Question' },
        { kind: 'p', text: 'When someone proposes a rewrite, I ask: what specific problems will this solve that targeted improvements won\'t? Rewrites are expensive and risky. Usually, incremental improvement is both safer and faster to deliver value.' },
        { kind: 'h3', text: 'Proven Over Hyped' },
        { kind: 'p', text: "I'm skeptical of hype, not of change. Most projects are better served by stable, well-understood tools than by chasing the latest framework. I adopted agents because they proved themselves on real work, not because they were new." },
      ],
    },
    {
      key: 'teams',
      title: 'Working With Teams',
      body: [
        { kind: 'p', text: "Good architecture comes from good collaboration. Some practices I've found valuable:" },
        {
          kind: 'ul',
          items: [
            { lead: 'Document decisions, not just implementations', text: 'ADRs capture why we chose something, which is more valuable than what we chose' },
            { lead: 'Make implicit knowledge explicit', text: 'If there\'s a "trick" to using a part of the codebase, that\'s a sign it needs refactoring or documentation' },
            { lead: 'Write it down for humans and agents', text: 'Good documentation is now context for agents too, and it directly improves their output' },
            { lead: 'Prefer boring code', text: 'Clever code is fun to write but expensive to maintain' },
            { lead: 'Small PRs, early feedback', text: 'Large changes are hard to review well' },
          ],
        },
      ],
    },
  ],
} as const
