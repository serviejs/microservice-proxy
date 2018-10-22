#!/usr/bin/env node

import { join } from 'path'
import { createServer } from 'http'
import { createHandler } from 'servie-http'
import { proxy } from './index'

const args = require('arg')({
  '--config': String,
  '--port': Number,
  '--hostname': String,
  '-c': '--config',
  '-p': '--port',
  '-H': '--hostname'
})

const {
  '--config': config,
  '--port': port = 9000,
  '--hostname': hostname = 'localhost'
} = args

if (!config) {
  console.error('> Start with `--config` (`-c`) option')
  process.exit(1)
}

const { rules } = require(join(process.cwd(), config))
const app = createHandler(proxy(rules))

createServer(app).listen(port, hostname, (err: Error | null) => {
  if (err) throw err

  console.log(`> Ready on http://${hostname}:${port}`)
})
