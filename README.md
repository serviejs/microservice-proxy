# Microservice Proxy

[![NPM version](https://img.shields.io/npm/v/microservice-proxy.svg?style=flat)](https://npmjs.org/package/microservice-proxy)
[![NPM downloads](https://img.shields.io/npm/dm/microservice-proxy.svg?style=flat)](https://npmjs.org/package/microservice-proxy)
[![Build status](https://img.shields.io/travis/serviejs/microservice-proxy.svg?style=flat)](https://travis-ci.org/serviejs/microservice-proxy)
[![Test coverage](https://img.shields.io/coveralls/serviejs/microservice-proxy.svg?style=flat)](https://coveralls.io/r/serviejs/microservice-proxy?branch=master)

> Simple proxy for your microservices based on [`servie`](https://github.com/serviejs/servie) and [`path-to-regexp`](https://github.com/pillarjs/path-to-regexp).

## Installation

```
npm install microservice-proxy --save
```

## Usage

Create the configuration:

```json
{
  "rules": [
    {
      "path": "/login",
      "methods": ["get"],
      "url": "http://localhost:3001"
    },
    {
      "url": "http://localhost:3000"
    }
  ]
}
```

Start the proxy:

```
microservice-proxy -c config.json -p 9000
```

Or programmatically:

```js
import { proxy } from "microservice-proxy";
import { createHandler } from "servie-http";
import { createServer } from "http";

const app = createHandler(
  proxy([
    {
      url: "http://example.com"
    }
  ])
);

createServer(app).listen(3000);
```

## Background

Originally, this module was going to manage processes themselves and dynamically assign port numbers. Unfortunately, it's a little complex to manage the dependencies between the process ports (leaving this for another day). I found [`micro-proxy`](https://github.com/zeit/micro-proxy) which is designed to do the same sort of thing, but it had a couple of issues - [path matching](https://github.com/zeit/micro-proxy/pull/35) and no HTTP/2 requests. I wrote this using ServieJS as an interesting case-study of how decoupling the request and response can lead to interesting mixups such as this (e.g. this could be deployed to AWS Lambda).

## TypeScript

This project is written using [TypeScript](https://github.com/Microsoft/TypeScript) and publishes the definitions directly to NPM.

## License

Apache 2.0
