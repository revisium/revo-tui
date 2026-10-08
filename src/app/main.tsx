import { writeSync } from 'node:fs'
import { createApplication } from './providers/createApplication.js'

const STDERR_FD = 2
const apiUrl = requiredEnvironment('REVO_TUI_API_URL')
const dataDir = requiredEnvironment('REVO_TUI_DATA_DIR')

const application = createApplication({
  apiUrl,
  clientName: 'Revo terminal client',
  dataDir,
})

try {
  process.exitCode = await application.run()
} catch (error) {
  const message = error instanceof Error ? error.message : String(error)
  writeSync(STDERR_FD, `Revo TUI failed: ${message}\n`)
  process.exitCode = 1
}

process.exit()

function requiredEnvironment(name: string): string {
  const value = process.env[name]

  if (!value) {
    throw new Error(`Required launcher environment ${name} is missing.`)
  }

  return value
}
