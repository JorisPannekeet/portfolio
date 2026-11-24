import type { ReactNode } from 'react'
import {
  AtSign,
  BookOpen,
  Briefcase,
  ChartBar,
  Compass,
  FolderGit2,
  Gamepad2,
  Heading,
  Heart,
  Image,
  Lightbulb,
  Minus,
  MoveVertical,
  Pilcrow,
  RectangleHorizontal,
  User,
  type LucideIcon,
} from 'lucide-react'
import * as B from './blocks'
import type { Block, BlockOf, BlockType } from './model'
import { experiences, games, howIWork, projects, stories } from './sources'

export const GROUPS = ['About me', 'Experience', 'Side projects', 'Games', 'How I work', 'Basics'] as const
type Group = (typeof GROUPS)[number]

type RefOption = { ref: string; label: string; description: string; group?: Group }

type Entry<T extends BlockType> = {
  label: string
  description: string
  icon: LucideIcon
  group: Group
  Render: (props: { block: BlockOf<T> }) => ReactNode
  refs?: readonly RefOption[]
}

const storyGroup: Record<string, Group> = { games: 'Games' }

export const registry: { [T in BlockType]: Entry<T> } = {
  hero: { label: 'Intro', description: 'Greeting, role, photo and links', icon: User, group: 'About me', Render: B.HeroBlock },
  skills: { label: 'Skills', description: 'Skills with years of experience', icon: ChartBar, group: 'About me', Render: B.SkillsBlock },
  approach: { label: 'My approach', description: 'Three working principles', icon: Compass, group: 'About me', Render: B.ApproachBlock },
  story: {
    label: 'Story',
    description: 'A section of my story',
    icon: BookOpen,
    group: 'About me',
    Render: B.StoryBlock,
    refs: stories.map(story => ({
      ref: story.key,
      label: story.key === 'intro' ? 'About intro' : story.key in storyGroup ? `${story.title} intro` : story.title,
      description: story.body.find(node => node.kind === 'p')?.text ?? story.title,
      group: storyGroup[story.key],
    })),
  },
  passions: { label: 'Beyond work', description: 'What I do away from the screen', icon: Heart, group: 'About me', Render: B.PassionsBlock },
  contact: { label: 'Contact', description: 'Email and social links', icon: AtSign, group: 'About me', Render: B.ContactBlock },
  experience: {
    label: 'Experience',
    description: 'A role I held',
    icon: Briefcase,
    group: 'Experience',
    Render: B.ExperienceBlock,
    refs: experiences.map(item => ({ ref: item.id, label: item.company ?? item.title, description: `${item.title} · ${item.period}` })),
  },
  project: {
    label: 'Side project',
    description: 'Something I built on the side',
    icon: FolderGit2,
    group: 'Side projects',
    Render: B.ProjectBlock,
    refs: projects.map(project => ({ ref: project.key, label: project.title, description: project.pitch })),
  },
  game: {
    label: 'Game',
    description: 'A game you can play',
    icon: Gamepad2,
    group: 'Games',
    Render: B.GameBlock,
    refs: games.map(game => ({ ref: game.key, label: game.title, description: game.pitch })),
  },
  howIWork: {
    label: 'How I work',
    description: 'A section of how I work',
    icon: Lightbulb,
    group: 'How I work',
    Render: B.HowIWorkBlock,
    refs: howIWork.map(section => ({ ref: section.key, label: section.key === 'intro' ? 'How I work intro' : section.title, description: section.body.find(node => node.kind === 'p')?.text ?? section.title })),
  },
  heading: { label: 'Heading', description: 'A title for a section', icon: Heading, group: 'Basics', Render: B.HeadingBlock },
  text: { label: 'Text', description: 'A paragraph of your own', icon: Pilcrow, group: 'Basics', Render: B.TextBlock },
  button: { label: 'Button', description: 'A link styled as a button', icon: RectangleHorizontal, group: 'Basics', Render: B.ButtonBlock },
  image: { label: 'Image', description: 'An image from a URL', icon: Image, group: 'Basics', Render: B.ImageBlock },
  divider: { label: 'Divider', description: 'A horizontal rule', icon: Minus, group: 'Basics', Render: B.DividerBlock },
  spacer: { label: 'Spacer', description: 'Empty vertical space', icon: MoveVertical, group: 'Basics', Render: B.SpacerBlock },
}

export type PaletteItem = { key: string; type: BlockType; ref?: string; label: string; description: string; icon: LucideIcon }

export const palette: { group: Group; items: PaletteItem[] }[] = GROUPS.map(group => ({ group, items: [] }))

for (const type of Object.keys(registry) as BlockType[]) {
  const entry: Entry<BlockType> = registry[type] as Entry<BlockType>
  const options = entry.refs ?? [{ ref: undefined, label: entry.label, description: entry.description }]
  for (const option of options) {
    const group = ('group' in option && option.group) || entry.group
    palette.find(bucket => bucket.group === group)?.items.push({
      key: `${type}:${option.ref ?? ''}`,
      type,
      ...(option.ref === undefined ? {} : { ref: option.ref }),
      label: option.label,
      description: option.description,
      icon: entry.icon,
    })
  }
}

export function paletteKey(block: Pick<Block, 'type' | 'ref'>): string {
  return `${block.type}:${block.ref ?? ''}`
}

export function isRenderable(block: Block): boolean {
  const refs = registry[block.type].refs
  return !refs || refs.some(option => option.ref === block.ref)
}

export function blockName(block: Block): string {
  const entry = registry[block.type]
  return entry.refs?.find(option => option.ref === block.ref)?.label ?? entry.label
}
