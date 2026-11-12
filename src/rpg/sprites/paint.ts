export type Rows = readonly string[]

export function recolor(rows: Rows, map: string, to: string): string[] {
  const out: string[] = []
  for (const row of rows) {
    let next = ''
    for (const key of row) {
      const at = map.indexOf(key)
      next += at < 0 ? key : to[at]!
    }
    out.push(next)
  }
  return out
}

export function stack(...blocks: Rows[]): string[] {
  const out: string[] = []
  for (const block of blocks) out.push(...block)
  return out
}

export function pad(rows: Rows, left: number, top: number, width: number, height: number): string[] {
  const out: string[] = []
  const blank = '.'.repeat(width)
  for (let y = 0; y < height; y++) {
    const row = rows[y - top]
    out.push(row === undefined ? blank : ('.'.repeat(left) + row + blank).slice(0, width))
  }
  return out
}

export function overlay(base: Rows, top: Rows, left = 0, offsetY = 0): string[] {
  return base.map((row, y) => {
    const over = top[y - offsetY]
    if (over === undefined) return row
    let next = ''
    for (let x = 0; x < row.length; x++) {
      const key = over[x - left]
      next += key === undefined || key === '.' ? row[x]! : key
    }
    return next
  })
}

export function stretch(rows: Rows, num: number, den: number): string[] {
  const h = Math.round((rows.length * num) / den)
  const w = Math.round((rows[0]!.length * num) / den)
  return field(w, h, (x, y) => rows[Math.floor((y * den) / num)]![Math.floor((x * den) / num)]!)
}

export function mirror(rows: Rows): string[] {
  return rows.map(row => [...row].reverse().join(''))
}

export function mirrorHalf(rows: Rows): string[] {
  return rows.map(row => row + [...row].reverse().join(''))
}

export function noise(x: number, y: number, seed: number): number {
  let h = Math.imul(x * 374761393 + y * 668265263 + seed * 2246822519, 1) | 0
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296
}

export function field(width: number, height: number, pick: (x: number, y: number) => string): string[] {
  const out: string[] = []
  for (let y = 0; y < height; y++) {
    let row = ''
    for (let x = 0; x < width; x++) row += pick(x, y)
    out.push(row)
  }
  return out
}

export function outlined(rows: Rows, ink = '0'): string[] {
  const h = rows.length
  const w = rows[0]!.length
  const solid = (x: number, y: number) => x >= 0 && y >= 0 && x < w && y < h && rows[y]![x] !== '.'
  return field(w, h, (x, y) => (solid(x, y) ? rows[y]![x]! : solid(x - 1, y) || solid(x + 1, y) || solid(x, y - 1) || solid(x, y + 1) ? ink : '.'))
}
