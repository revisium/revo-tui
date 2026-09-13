#!/usr/bin/env node
import { runCli } from '../dist/launcher/cli.js'

const ARGUMENT_OFFSET = 2

process.exitCode = await runCli(process.argv.slice(ARGUMENT_OFFSET))
