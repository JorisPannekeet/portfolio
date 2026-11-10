export function zoneAt(x: number, y: number): number {
  return (x >= 0 ? 1 : 0) + (y >= 0 ? 2 : 0)
}
