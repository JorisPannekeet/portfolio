import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'

const game = {
  rules: {
    'no-comments': {
      create(context) {
        return {
          Program() {
            for (const comment of context.sourceCode.getAllComments()) {
              context.report({ loc: comment.loc, message: 'Comments are banned in game code. Rename or add a test.' })
            }
          },
        }
      },
    },
  },
}

const ban = (selector, message) => ({ selector, message })

const hotBans = [
  ban('ObjectExpression', 'Hot path: no object literals. Preallocate in a non-hot file.'),
  ban('ArrayExpression', 'Hot path: no array literals. Preallocate in a non-hot file.'),
  ban('ArrowFunctionExpression', 'Hot path: no closures.'),
  ban('FunctionExpression', 'Hot path: no closures.'),
  ban('NewExpression', 'Hot path: no allocation with new.'),
  ban('SpreadElement', 'Hot path: no spread.'),
  ban('RestElement', 'Hot path: no rest.'),
  ban('TemplateLiteral', 'Hot path: no template strings.'),
  ban('ArrayPattern', 'Hot path: no array destructuring.'),
  ban('ClassDeclaration', 'Hot path: no classes.'),
  ban(
    'CallExpression[callee.property.name=/^(map|filter|reduce|forEach|slice|concat|flatMap|flat|splice|keys|values|entries|sort|toString|toFixed|join|split)$/]',
    'Hot path: no allocating or callback-taking methods. Use index loops.',
  ),
]

const simBans = [
  ban('ForInStatement', 'Sim: iteration order must be explicit.'),
  ban('NewExpression[callee.name=/^(Map|Set|WeakMap|WeakSet|Date)$/]', 'Sim: no unordered collections or clocks.'),
]

const simProperties = [
  ...['random', 'sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'atan2', 'exp', 'log', 'log2', 'log10', 'pow', 'hypot', 'cbrt', 'sinh', 'cosh', 'tanh'].map(property => ({
    object: 'Math',
    property,
    message: 'Sim: platform-variant or unseeded math. Use the seeded PRNG and the trig lookup table.',
  })),
  { object: 'performance', property: 'now', message: 'Sim: time is the tick count.' },
  { object: 'Date', property: 'now', message: 'Sim: time is the tick count.' },
]

const assetImports = { group: ['*.png', '*.jpg', '*.jpeg', '*.gif', '*.webp', '*.svg', '*.mp3', '*.ogg', '*.wav'], message: 'Game art and audio are source code.' }

export default tseslint.config(
  { ignores: ['dist'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
    },
  },
  {
    files: ['src/{game,rpg}/**/*.{ts,tsx}', 'src/pages/{Play,Rpg}.tsx', 'tests/**/*.ts'],
    plugins: { game },
    rules: {
      'game/no-comments': 'error',
      'no-restricted-imports': ['error', { patterns: [assetImports] }],
    },
  },
  {
    files: ['src/{game,rpg}/sim/**/*.ts'],
    rules: {
      'no-restricted-syntax': ['error', ...simBans],
      'no-restricted-properties': ['error', ...simProperties],
      'no-restricted-globals': ['error', 'window', 'document', 'navigator', 'performance', 'Date', 'requestAnimationFrame', 'setTimeout', 'setInterval', 'localStorage'],
      'no-restricted-imports': ['error', {
        patterns: [
          assetImports,
          { regex: '^(?!\\./|\\.\\./\\.\\./game/sim/(prng\\.hot|trig)\\.ts$)', message: 'Sim imports only sibling sim modules and the shared PRNG and trig table: no renderer, DOM, audio or UI.' },
        ],
      }],
    },
  },
  {
    files: ['src/game/sim/trig.ts'],
    rules: { 'no-restricted-properties': 'off' },
  },
  {
    files: ['src/{game,rpg}/**/*.hot.ts'],
    rules: { 'no-restricted-syntax': ['error', ...hotBans] },
  },
  {
    files: ['src/{game,rpg}/sim/**/*.hot.ts'],
    rules: { 'no-restricted-syntax': ['error', ...simBans, ...hotBans] },
  },
  {
    files: ['src/{game,rpg}/sprites/**/*.ts'],
    rules: {
      'no-restricted-syntax': ['error', ban('Literal[value=/#[0-9a-fA-F]{3,8}\\b|rgba?\\(|hsla?\\(/]', 'Sprites reference palette indices only.')],
    },
  },
  {
    files: ['src/{game,rpg}/ui/**/*.tsx', 'src/pages/{Play,Rpg}.tsx'],
    rules: {
      'no-restricted-syntax': [
        'error',
        ban('JSXText[value=/[A-Za-z]/]', 'UI text goes through i18n keys.'),
        ban('JSXAttribute[name.name=/^(aria-label|title|alt|placeholder)$/] > Literal', 'UI text goes through i18n keys.'),
      ],
    },
  },
)
