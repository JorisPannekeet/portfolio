import { content } from '@/data/content'
import { getExperienceItems } from '../../lib/data'

export type RichNode =
  | { readonly kind: 'p'; readonly text: string }
  | { readonly kind: 'h3'; readonly text: string }
  | { readonly kind: 'ul'; readonly items: readonly { readonly lead?: string; readonly text: string }[] }

export type Article = { readonly key: string; readonly title: string; readonly body: readonly RichNode[] }

const slug = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

const month = new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' })
const formatMonth = (date: string | null | undefined) => (date ? month.format(new Date(date)) : null)

export const stories: readonly Article[] = [
  ...content.about.story,
  { key: 'games', title: 'Games', body: [{ kind: 'p', text: content.gamesIntro }] },
]

export const howIWork: readonly Article[] = content.howIWork

export const experiences = [...getExperienceItems()]
  .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
  .map(item => ({ ...item, period: `${formatMonth(item.startDate) ?? ''} – ${formatMonth(item.endDate) ?? 'Present'}` }))

export const projects = content.projects.map(project => ({ ...project, key: slug(project.title) }))
export const games = content.games.map(game => ({ ...game, key: slug(game.title) }))

export { content }
