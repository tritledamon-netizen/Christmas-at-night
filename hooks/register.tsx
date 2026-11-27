import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register, SessionRateLimit, ThemeSetArgs } from 'claude-code'

import type { Snow } from '../types'
import { makeColors } from './make-colors.js'

// The snow level: `live` follows the usage limit, `preview` is set by /snow.
const snow = atom({ plugin: 'winter-night', key: 'snow' } as const, { live: 0, preview: null } as Snow, {
  shape: 'snow-1',
})

const { theme, problems } = makeColors({
  label: 'Winter night, Christmas',
  only: 'dark',
  roles: { accent: '#e3b04b', danger: '#e0656b', success: '#6fbf8e', warning: '#e0b45c', pro: '#a68be0' },
  dark: {
    gray: {
      anchors: {
        'surface-0': '#0b1220',
        'surface-1': '#111a2b',
        'surface-2': '#162136',
        'surface-3': '#1b273d',
        'text-primary': '#eaf0f8',
        'text-secondary': '#c3cfe0',
        'text-muted': '#93a3ba',
      },
    },
  },
})

const LOOK: ThemeSetArgs = {
  colors: theme,
  backdrop: { scene: 'winter-night', glass: { blur: 14, tint: '#0b1426', opacity: 0.55 } },
}

// The highest of the limit windows, 0 to 100.
const levelOf = (limits: SessionRateLimit[]) =>
  Math.max(0, Math.min(100, ...limits.map(l => l.percentUsed), 0))

// A small seeded random, so the scene stays put between redraws.
const rng = (seed: number) => () => {
  seed = (seed * 16807) % 2147483647
  return seed / 2147483647
}

const n = (v: number) => Math.round(v * 10) / 10

const pine = (x: number, h: number, cap: number) => {
  const w = h * 0.42
  const base = 1000
  const tiers = [0, 0.3, 0.55]
  let out = `<rect x="${n(x - h * 0.03)}" y="${n(base - h * 0.14)}" width="${n(h * 0.06)}" height="${n(h * 0.14)}" fill="#0a1220"/>`
  for (const t of tiers) {
    const top = base - h + t * h * 0.9
    const bottom = base - h * 0.1 - (0.55 - t) * h * 0.55
    const half = (w / 2) * (1 - t * 0.55)
    out += `<path d="M${n(x)} ${n(top)}L${n(x + half)} ${n(bottom)}L${n(x - half)} ${n(bottom)}Z" fill="#0d1b2d"/>`
    // snow resting along the bottom of each tier and on the tip, deeper as the level rises
    const t2 = 5 + cap * 12
    out += `<path d="M${n(x - half)} ${n(bottom)}Q${n(x)} ${n(bottom - t2 * 1.6)} ${n(x + half)} ${n(bottom)}Q${n(x)} ${n(bottom - t2 * 0.4)} ${n(x - half)} ${n(bottom)}Z" fill="#dfe8f5"/>`
    const sh = (bottom - top) * (0.16 + cap * 0.22)
    const sw = half * (sh / (bottom - top))
    out += `<path d="M${n(x)} ${n(top)}L${n(x + sw)} ${n(top + sh)}Q${n(x)} ${n(top + sh * 0.75)} ${n(x - sw)} ${n(top + sh)}Z" fill="#e6eef8"/>`
    // a string of lights draped across the tier
    const y0 = top + (bottom - top) * 0.78
    const y2 = top + (bottom - top) * 0.5
    const x0 = x - half * 0.72
    const x2 = x + half * 0.46
    const cx = x
    const cy = (y0 + y2) / 2 + (bottom - top) * 0.16
    out += `<path d="M${n(x0)} ${n(y0)}Q${n(cx)} ${n(cy)} ${n(x2)} ${n(y2)}" fill="none" stroke="#08111c" stroke-width="1.5"/>`
    const bulbs = Math.max(4, Math.round(half / 14))
    for (let k = 0; k <= bulbs; k++) {
      const u = k / bulbs
      const bx = (1 - u) * (1 - u) * x0 + 2 * u * (1 - u) * cx + u * u * x2
      const by = (1 - u) * (1 - u) * y0 + 2 * u * (1 - u) * cy + u * u * y2
      const c = (k + Math.round(t * 10)) % 4
      out += `<g class="l c${c}" style="animation-duration:${n(2.6 + ((k * 7 + h) % 5) * 0.6)}s;animation-delay:-${n((k * 1.3) % 4)}s"><circle cx="${n(bx)}" cy="${n(by)}" r="${n(h / 55)}" opacity="0.3"/><circle cx="${n(bx)}" cy="${n(by + 1)}" r="${n(h / 150)}"/></g>`
    }
  }
  return out
}

// a five-pointed star with a soft glow, for the top of the tallest tree
const topper = (x: number, y: number, size: number) => {
  let d = ''
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5
    const rad = i % 2 === 0 ? size : size * 0.42
    d += `${i === 0 ? 'M' : 'L'}${n(x + Math.cos(a) * rad)} ${n(y + Math.sin(a) * rad)}`
  }
  return `<circle class="halo" cx="${n(x)}" cy="${n(y)}" r="${n(size * 3)}" fill="url(#gold)"/><path d="${d}Z" fill="#f6cf5f" stroke="#fff3c4" stroke-width="1"/>`
}

// one small reindeer, its nose at (x, y), facing right
const deer = (x: number, y: number) =>
  `<ellipse cx="${x - 14}" cy="${y + 6}" rx="11" ry="5"/><path d="M${x - 5} ${y + 4}L${x - 1} ${y - 3}L${x + 3} ${y - 2}L${x} ${y + 5}Z"/><path d="M${x - 22} ${y + 9}l-4 9M${x - 18} ${y + 10}l-1 9M${x - 9} ${y + 10}l3 9M${x - 6} ${y + 9}l5 8M${x - 1} ${y - 3}l-3 -6l-3 1M${x - 1} ${y - 3}l1 -7l3 -1M${x - 2} ${y - 7}l-3 -2" fill="none" stroke-width="1.6"/>`

const sleigh = () =>
  `<g class="sl" fill="#0a1222" stroke="#0a1222">${deer(1060, 120)}${deer(1028, 124)}${deer(996, 128)}<path d="M985 134L940 146" fill="none" stroke-width="1"/><path d="M905 136L940 136L938 150L912 152Q900 150 905 136Z"/><path d="M898 156Q920 160 944 154" fill="none" stroke-width="2"/></g>`

const scene = (level: number) => {
  const p = level / 100
  const r = rng(42)
  const top = 1000 - (34 + Math.pow(p, 1.5) * 640) // where the snowdrift reaches

  let stars = ''
  for (let i = 0; i < 110; i++) {
    const d = n(5 + r() * 7)
    stars += `<circle cx="${n(r() * 1600)}" cy="${n(r() * 620)}" r="${n(0.6 + r() * 1.4)}" style="animation-duration:${d}s;animation-delay:-${n(r() * d)}s"/>`
  }

  const count = Math.round(60 + p * 240)
  let flakes = ''
  for (let i = 0; i < count; i++) {
    const d = n(11 + r() * 14 - p * 3)
    const size = r()
    flakes += `<circle class="f${i % 3}" cx="${n(r() * 1640 - 20)}" cy="${n(r() * 1100)}" r="${n(1.8 + size * 3.4)}" opacity="${n(0.55 + size * 0.4)}" style="animation-duration:${d}s;animation-delay:-${n(r() * d)}s"/>`
  }

  // a gently rolling drift, two layers
  const drift = (y: number, amp: number, phase: number, fill: string) => {
    let d = `M0 1000L0 ${n(y)}`
    for (let x = 0; x < 1600; x += 200) {
      const y1 = y + Math.sin(x / 260 + phase) * amp
      const y2 = y + Math.sin((x + 200) / 260 + phase) * amp
      d += `C${x + 70} ${n(y1 - amp)} ${x + 130} ${n(y2 + amp)} ${x + 200} ${n(y2)}`
    }
    return `<path d="${d}L1600 1000Z" fill="${fill}"/>`
  }

  const cabinY = 1000 - 120
  let roof = ''
  for (let k = 0; k <= 12; k++) {
    const u = k / 12
    const rx = 1117 + u * 176
    const ry = cabinY + 6 - (1 - Math.abs(u * 2 - 1)) * 64
    roof += `<g class="l c${k % 4}" style="animation-duration:${n(2.8 + (k % 3) * 0.7)}s;animation-delay:-${n(k * 0.45)}s"><circle cx="${n(rx)}" cy="${n(ry)}" r="7" opacity="0.3"/><circle cx="${n(rx)}" cy="${n(ry + 1)}" r="2.6"/></g>`
  }
  const cabin = `<g transform="translate(1205 1000) scale(1.5) translate(-1205 -1000)"><rect x="1130" y="${cabinY}" width="150" height="120" fill="#1a1d2a"/><path d="M1115 ${cabinY + 4}L1205 ${cabinY - 62}L1295 ${cabinY + 4}Z" fill="#e6eef8"/><rect x="1160" y="${cabinY + 36}" width="34" height="30" fill="#f2b35e"/><rect x="1225" y="${cabinY + 50}" width="32" height="70" fill="#121521"/><rect x="1165" y="${cabinY + 10}" width="70" height="70" fill="url(#glow)"/><circle cx="1241" cy="${cabinY + 66}" r="9" fill="none" stroke="#2f6b3a" stroke-width="5"/><path d="M1236 ${cabinY + 74}l5 -3l5 3l-2 5l-3 -3l-3 3Z" fill="#c8363a"/>${roof}</g>`

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice">
<defs>
<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#050a18"/><stop offset="0.55" stop-color="#0f1d3a"/><stop offset="1" stop-color="#25365a"/></linearGradient>
<radialGradient id="moon" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#dfe8ff" stop-opacity="0.35"/><stop offset="1" stop-color="#dfe8ff" stop-opacity="0"/></radialGradient>
<radialGradient id="glow" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#f2b35e" stop-opacity="0.35"/><stop offset="1" stop-color="#f2b35e" stop-opacity="0"/></radialGradient>
<radialGradient id="gold" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#ffd76a" stop-opacity="0.55"/><stop offset="1" stop-color="#ffd76a" stop-opacity="0"/></radialGradient>
<linearGradient id="drift" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f4f8ff"/><stop offset="1" stop-color="#b9c9e2"/></linearGradient>
</defs>
<style>
.s circle{fill:#dfe6ff;opacity:0.8;animation:tw ease-in-out infinite alternate}
@keyframes tw{from{opacity:0.35}to{opacity:0.95}}
.w circle{fill:#ffffff;animation-timing-function:linear;animation-iteration-count:infinite}
.w .f0{animation-name:a}
.w .f1{animation-name:b}
.w .f2{animation-name:c}
@keyframes a{from{transform:translate(0px,-1100px)}to{transform:translate(50px,0px)}}
@keyframes b{from{transform:translate(0px,-1100px)}to{transform:translate(-40px,0px)}}
.l{animation:glow ease-in-out infinite alternate}
@keyframes glow{from{opacity:0.55}to{opacity:1}}
.c0 circle{fill:#ff5a5f}.c1 circle{fill:#ffd45c}.c2 circle{fill:#5fd38a}.c3 circle{fill:#6fb6ff}
.halo{animation:glow 4s ease-in-out infinite alternate}
.sl{animation:fly 48s linear infinite}
@keyframes fly{from{transform:translate(-1500px,60px)}to{transform:translate(900px,-70px)}}
@keyframes c{from{transform:translate(0px,-1100px)}to{transform:translate(15px,0px)}}
</style>
<rect width="1600" height="1000" fill="url(#sky)"/>
<g class="s">${stars}</g>
<circle cx="1010" cy="140" r="150" fill="url(#moon)"/>
<circle cx="1010" cy="140" r="44" fill="#eef2ff"/>
<circle cx="996" cy="130" r="8" fill="#d6ddf0"/><circle cx="1024" cy="156" r="5" fill="#d6ddf0"/>
${sleigh()}
<path d="M0 760Q260 690 520 740T1040 720T1600 750L1600 1000L0 1000Z" fill="#17243f"/>
${pine(90, 380, p)}${pine(260, 300, p)}${pine(420, 220, p)}${pine(620, 260, p)}${pine(980, 240, p)}${pine(1380, 340, p)}${pine(1530, 420, p)}${topper(1530, 578, 18)}
${cabin}
<g class="w">${flakes}</g>
${drift(top - 12, 16, 1.3, '#c9d6ec')}
${drift(top, 12, 0, 'url(#drift)')}
</svg>`
}

async function show($: EngineInterface) {
  const s = await read($, snow)
  const level = s.preview ?? s.live
  $.ui.status(`🎄 ${Math.round(level)}% snowfall${s.preview !== null ? ' (preview)' : ''}`)
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    const unpainted = problems.find(line => line.startsWith("Desktop won't paint"))
    if (unpainted !== undefined) {
      $.ui.toast(unpainted)
    }

    await $.command.register({
      name: 'snow',
      description: 'Preview the snow at a level (0-100), or "live" to follow your usage limit',
    })

    const usage = await $.session.usage()
    await update($, snow, s => ({ ...s, live: levelOf(usage.rateLimits) }))

    const set = await $.theme.set(LOOK)
    if (!set.isDrawn) {
      $.ui.log(set.reason)
    }
    await show($)

    return next(e)
  })

  on('session.measure', async ($, e, next) => {
    if (e.changed.includes('rateLimits')) {
      const before = (await read($, snow)).live
      const live = levelOf(e.rateLimits)
      await update($, snow, s => ({ ...s, live }))
      if (before < 90 && live >= 90) {
        $.ui.toast('❄ The snow is getting deep: you are past 90% of your usage limit.')
      }
      await show($)
    }
    return next(e)
  })

  on('command.run', { command: 'snow' }, async ($, e) => {
    const arg = e.args.trim().toLowerCase()
    const value = Number(arg.replace('%', ''))
    if (arg === '' || arg === 'live') {
      await update($, snow, s => ({ ...s, preview: null }))
      await show($)
      const s = await read($, snow)
      return { text: `Snow follows your usage limit again (${Math.round(s.live)}% now).` }
    }
    if (!Number.isFinite(value) || value < 0 || value > 100) {
      return { text: 'Usage: /snow <0-100> to preview a level, or /snow live.' }
    }
    await update($, snow, s => ({ ...s, preview: value }))
    await show($)
    return { text: `Previewing snow at ${value}%. Type /snow live to go back.` }
  })

  on('ui.render', { component: 'Backdrop' }, async ($, e, next) => {
    if ((e.surface !== 'desktop' && e.surface !== 'mobile') || e.props.scene !== 'winter-night') {
      return next(e)
    }
    const { Svg } = $.ui.resolve(e)
    const s = await read($, snow)
    const level = s.preview ?? s.live

    return (
      <Svg
        source={scene(level)}
        alt={`A snowy pine forest at night, strung with Christmas lights,, the snow ${Math.round(level)}% deep`}
        isInteractive
      />
    )
  })
}

