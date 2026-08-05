import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

const SYSTEM_PROMPT = `You are Kaojai.ai's helpful AI assistant. Answer in Thai unless the user asks for another language. Help with travel, hotel bookings, and using this app. Be concise and accurate. If the user asks to change the color of the \"Explore destinations\" button, set action.type to \"set_explore_button_color\" and action.color to a CSS hex color. If the user asks to place an imported image on the Landing page, only choose an exact filename from the available imported images and set action.type to \"set_landing_hero_image\" with that filename. For every other request, set action.type to \"none\".`

const CHAT_RESPONSE_FORMAT = {
  type: 'json_schema',
  name: 'kaojai_ai_chat_response',
  strict: true,
  schema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      reply: { type: 'string' },
      action: {
        type: 'object',
        additionalProperties: false,
        properties: {
          type: { type: 'string', enum: ['none', 'set_explore_button_color', 'set_landing_hero_image'] },
          color: { type: 'string' },
          fileName: { type: 'string' },
        },
        required: ['type', 'color', 'fileName'],
      },
    },
    required: ['reply', 'action'],
  },
}

function chatApi() {
  return {
    name: 'kaojai-ai-chat-api',
    configureServer(server) {
      server.middlewares.use('/api/chat', async (request, response) => {
        if (request.method !== 'POST') {
          response.writeHead(405, { Allow: 'POST' })
          response.end(JSON.stringify({ error: 'Method not allowed' }))
          return
        }

        let body = ''
        for await (const chunk of request) body += chunk

        try {
          const { message, history = [], importedImages = [] } = JSON.parse(body)
          if (!message?.trim()) throw new Error('Please enter a message.')
          if (!process.env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY is not configured on the server.')

          const upstream = await fetch('https://api.openai.com/v1/responses', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: process.env.OPENAI_MODEL || 'gpt-5.3-codex',
              instructions: SYSTEM_PROMPT,
              input: [...history.slice(-8), { role: 'user', content: `Available imported images: ${importedImages.join(', ') || 'none'}.\n\nUser request: ${message}` }],
              text: { format: CHAT_RESPONSE_FORMAT },
            }),
          })
          const result = await upstream.json()
          if (!upstream.ok) throw new Error(result.error?.message || 'OpenAI request failed.')

          const reply = result.output
            ?.flatMap((item) => item.content || [])
            .filter((part) => part.type === 'output_text')
            .map((part) => part.text)
            .join('')

          if (!reply) throw new Error('The model returned no text response.')
          const parsedReply = JSON.parse(reply)
          response.writeHead(200, { 'Content-Type': 'application/json' })
          response.end(JSON.stringify(parsedReply))
        } catch (error) {
          response.writeHead(400, { 'Content-Type': 'application/json' })
          response.end(JSON.stringify({ error: error.message || 'Unable to process this request.' }))
        }
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  Object.assign(process.env, {
    OPENAI_API_KEY: env.OPENAI_API_KEY || process.env.OPENAI_API_KEY,
    OPENAI_MODEL: env.OPENAI_MODEL || process.env.OPENAI_MODEL,
  })
  return { plugins: [react(), chatApi()] }
})
