import { Request, Response } from "servie/dist/node";
import { useRawBody } from "servie/dist/common";
import pathToRegexp = require("path-to-regexp");
import { getURL } from "servie-url";
import { transport } from "popsicle-transport-http";

/**
 * Proxy configuration object.
 */
export interface Config {
  path?: string;
  methods?: string[];
  url: string;
}

/**
 * Create a simple service to proxy requests.
 */
export class Service {
  re?: RegExp;
  methods?: Set<string>;
  url: string;

  constructor(config: Config) {
    this.re = config.path
      ? pathToRegexp(config.path, [], { strict: true })
      : undefined;
    this.methods = config.methods
      ? new Set(config.methods.map(x => x.toLowerCase()))
      : undefined;
    this.url = config.url;
  }

  isMethod(method: string) {
    return this.methods ? this.methods.has(method.toLowerCase()) : true;
  }

  isPath(path: string) {
    return this.re ? this.re.test(path) : true;
  }

  matches(req: Request) {
    return (
      this.isMethod(req.method) && this.isPath(getURL(req).pathname || "/")
    );
  }
}

/**
 * Proxy any number of paths to services.
 */
export function proxy(configs: Config[]) {
  const services = configs.map(config => new Service(config));

  // Forward HTTP requests raw without any pre-processing.
  const send = transport();

  return async (req: Request, next: () => Promise<Response>) => {
    for (const service of services) {
      if (service.matches(req)) {
        const proxyReq = new Request(`${service.url}${req.url}`, {
          method: req.method,
          headers: req.headers,
          signal: req.signal,
          omitDefaultHeaders: true,
          body: useRawBody(req),
          trailer: req.trailer
        });

        return send(proxyReq, () => {
          return Promise.reject(new TypeError("Unhandled proxy request"));
        });
      }
    }

    return next(); // 404.
  };
}
