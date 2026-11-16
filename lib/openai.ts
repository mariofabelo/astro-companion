import OpenAI from 'openai'

// Created lazily so importing this module (e.g. during `next build`) doesn't
// throw when OPENAI_API_KEY isn't available yet.
let client: OpenAI | null = null

function getClient(): OpenAI {
  if (!client) {
    client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  }
  return client
}

export const openai = new Proxy({} as OpenAI, {
  get(_target, prop) {
    const c = getClient()
    const value = Reflect.get(c, prop, c)
    return typeof value === 'function' ? value.bind(c) : value
  },
})
