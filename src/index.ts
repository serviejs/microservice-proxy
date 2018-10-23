import { Request, Response } from 'servie'
import pathToRegexp = require('path-to-regexp')
import { request, send as transport } from 'popsicle/dist/node'

/**
 * Process request using basic node.js transport (no normalization).
 */
const send = transport({})

/**
 * Proxy configuration object.
 */
export interface Config {
  path?: string
  methods?: string[]
  url: string
}

/**
 * Create a simple service to proxy requests.
 */
export class Service {
  re?: RegExp
  methods?: Set<string>
  url: string

  constructor (config: Config) {
    this.re = config.path ? pathToRegexp(config.path, [], { strict: true }) : undefined
    this.methods = config.methods ? new Set(config.methods.map(x => x.toLowerCase())) : undefined
    this.url = config.url
  }

  isMethod (method: string) {
    return this.methods ? this.methods.has(method.toLowerCase()) : true
  }

  isPath (path: string) {
    return this.re ? this.re.test(path) : true
  }

  matches (req: Request) {
    return this.isMethod(req.method) && this.isPath(req.Url.pathname || '/')
  }
}

/**
 * Proxy any number of paths to services.
 */
export function proxy (configs: Config[]) {
  const services = configs.map(config => new Service(config))

  return async (req: Request, next: () => Promise<Response>) => {
    for (const service of services) {
      if (service.matches(req)) {
        const proxyReq = request(`${service.url}${req.url}`, {
          method: req.method,
          headers: req.headers,
          body: req.body,
          trailer: req.trailer
        })

        const res = await send(proxyReq)

        return new Response({
          statusCode: res.statusCode,
          statusMessage: res.statusMessage,
          headers: res.headers,
          body: res.body,
          trailer: res.trailer
        })
      }
    }

    return next() // 404.
  }
}
