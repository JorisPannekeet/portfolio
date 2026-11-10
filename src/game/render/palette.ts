export const PALETTE_KEYS = '012345gswWRrOoAaUuTtHhVvCcGeBbYkKmMiIjJfnNpPEFqzZyx6789lLQSdDX'

export const PALETTE_HEX: readonly string[] = [
  '#0D0F12',
  '#15181D',
  '#1E222A',
  '#2B313B',
  '#3D4450',
  '#5C6573',
  '#8F96A3',
  '#C9CED6',
  '#E6E8EC',
  '#F4F5F7',
  '#FF2B3D',
  '#C8102E',
  '#8C9C40',
  '#4F5A22',
  '#FFB020',
  '#A8620A',
  '#C9642F',
  '#6E3216',
  '#4FA39A',
  '#2B5853',
  '#B89D64',
  '#6A5834',
  '#B868FF',
  '#55288A',
  '#8AF0FF',
  '#2A9FD6',
  '#5CFF8E',
  '#1E9E54',
  '#5C8DFF',
  '#2A44B0',
  '#FFF4B0',
  '#1A332C',
  '#28211A',
  '#362C22',
  '#4D3E2C',
  '#29503F',
  '#16282C',
  '#1F3A3F',
  '#2F5A60',
  '#A9E6E2',
  '#0A0808',
  '#151010',
  '#221919',
  '#33241F',
  '#FF6A1F',
  '#A3300E',
  '#5A0A16',
  '#DCC08A',
  '#C6A46E',
  '#B08D5A',
  '#957447',
  '#E4EEF3',
  '#C0D8E3',
  '#A2C0D0',
  '#88A9BC',
  '#6E90A6',
  '#527489',
  '#38566C',
  '#4A403B',
  '#6B605A',
  '#3F2C25',
  '#3F7258',
]

export const TRANSPARENT_KEY = '.'

export function paletteIndex(key: string): number {
  return PALETTE_KEYS.indexOf(key)
}

export function paletteRgba(): Uint8Array {
  const out = new Uint8Array(PALETTE_HEX.length * 4)
  for (let i = 0; i < PALETTE_HEX.length; i++) {
    const hex = PALETTE_HEX[i]!
    out[i * 4] = parseInt(hex.slice(1, 3), 16)
    out[i * 4 + 1] = parseInt(hex.slice(3, 5), 16)
    out[i * 4 + 2] = parseInt(hex.slice(5, 7), 16)
    out[i * 4 + 3] = 255
  }
  return out
}
