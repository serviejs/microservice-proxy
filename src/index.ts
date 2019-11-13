import { Request, Response } from "servie/dist/node";
import { useRawBody } from "servie/dist/common";
import { pathToRegexp } from "path-to-regexp";
import { getURL } from "servie-url";
import { transport, HttpResponse } from "popsicle-transport-http";
import { URL } from "url";

/**
 * Proxy configuration object.
 */
export interface Config {
  url: string;
  path?: string;
  methods?: string[];
  newPath?: string;
  end?: boolean;
  start?: boolean;
  sensitive?: boolean;
}

/**
 * Create a simple service to proxy requests.
 */
export class Service {
  url: string;
  re: RegExp;
  methods: Set<string>;
  newPath?: string;

  constructor(config: Config) {
    const { path, methods, url, newPath, end, start, sensitive } = config;

    this.re = pathToRegexp(path || "/", undefined, {
      strict: true,
      start,
      end,
      sensitive
    });
    this.methods = new Set((methods || []).map(x => x.toLowerCase()));
    this.url = url;
    this.newPath = newPath;
  }

  isMethod(method: string) {
    return this.methods.size === 0 || this.methods.has(method.toLowerCase());
  }

  isPath(path: string) {
    return this.re.test(path);
  }

  matches(url: URL, method: string) {
    return this.isMethod(method) && this.isPath(url.pathname);
  }

  getPath(path: string) {
    if (!this.newPath) return path;

    return path.replace(this.re, this.newPath);
  }

  getUrl(url: URL) {
    return `${this.url}${this.getPath(url.pathname)}${url.search}${url.hash}`;
  }
}

/**
 * Proxy any number of paths to services.
 */
export function proxy(
  configs: Config[],
  send: (req: Request, next: () => never) => Promise<Response> = transport()
) {
  const services = configs.map(config => new Service(config));

  return async (req: Request, next: () => Promise<Response>) => {
    const url = getURL(req);

    for (const service of services) {
      if (service.matches(url, req.method)) {
        const proxyReq = new Request(service.getUrl(url), {
          method: req.method,
          headers: req.headers,
          signal: req.signal,
          omitDefaultHeaders: true,
          body: useRawBody(req),
          trailer: req.trailer
        });

        return send(proxyReq, () => {
          throw new TypeError("Unhandled proxy request");
        });
      }
    }

    return next(); // 404.
  };
}
