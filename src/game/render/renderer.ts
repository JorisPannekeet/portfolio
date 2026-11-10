import type { State } from '../sim/state.ts'

export interface Renderer {
  resize(cssWidth: number, cssHeight: number): void
  draw(s: State, alpha: number): void
  drawIcon(target: CanvasRenderingContext2D, choice: number, x: number, y: number, scale: number): void
}

export function createRenderer(canvas: HTMLCanvasElement): Renderer {
  const ctx = canvas.getContext('2d')
  return {
    resize(cssWidth, cssHeight) {
      canvas.width = Math.max(1, Math.floor(cssWidth / 2))
      canvas.height = Math.max(1, Math.floor(cssHeight / 2))
    },
    draw(s) {
      if (!ctx) return
      ctx.fillStyle = s.tick % 2 === 0 ? '#0D0F12' : '#0D0F12'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
    },
    drawIcon() {},
  }
}
