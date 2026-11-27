export type Snow = { live: number; preview: number | null }

declare module 'claude-code' {
  interface PluginState {
    'winter-night': { snow: Shaped<Snow> }
  }
}
