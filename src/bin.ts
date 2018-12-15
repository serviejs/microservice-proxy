#!/usr/bin/env node

import arg = require('arg')
import { join } from 'path'
import { createServer } from 'http'
import { createHandler } from 'servie-http'
import { proxy } from './index'

const args = arg({
  '--config': String,
  '--port': Number,
  '--hostname': String,
  '--help': Boolean,
  '-c': '--config',
  '-p': '--port',
  '-h': '--help',
  '-H': '--hostname'
})

const {
  '--help': help,
  '--config': config,
  '--port': port = 9000,
  '--hostname': hostname = '0.0.0.0'
} = args

if (help) {
  console.log(`
  Description
    Start a HTTP-based micro-service proxy
  Usage
    $ microservice-proxy -p <port> -c <config.json>
  Options
    --config, -c    The route configuration file
    --port, -p      The port number to start the proxy (${port})
    --hostname, -H  The host name to start the proxy (${hostname})
  `)

  process.exit(0)
}

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
