import { createApplication } from './providers/createApplication.js'

const apiUrl = requiredEnvironment('REVO_TUI_API_URL')
requiredEnvironment('REVO_TUI_DATA_DIR')

const application = createApplication({
  apiUrl,
  clientName: 'Revo terminal client',
})

try {
  process.exitCode = await application.run()
} catch (error) {
  const message = error instanceof Error ? error.message : String(error)
  process.stderr.write(`Revo TUI failed: ${message}\n`)
  process.exitCode = 1
}

function requiredEnvironment(name: string): string {
  const value = process.env[name]

  if (!value) {
    throw new Error(`Required launcher environment ${name} is missing.`)
  }

  return value
}
