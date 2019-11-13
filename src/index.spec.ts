import { proxy } from "./index";
import { Response, Request } from "servie/dist/node";

describe("microservice proxy", () => {
  it("should create a proxy", async () => {
    const send = jest.fn(async (_: Request) => new Response("test"));

    const m = proxy(
      [
        {
          url: "http://example.com"
        }
      ],
      send
    );

    const res = await m(new Request("http://localhost"), jest.fn());

    expect(send).toHaveBeenCalledTimes(1);
    expect(send.mock.calls[0][0].url).toEqual("http://example.com/");
    expect(await res.text()).toEqual("test");
  });

  it("should map to a new path", async () => {
    const send = jest.fn(async (_: Request) => new Response("test"));

    const m = proxy(
      [
        {
          url: "http://example.com",
          newPath: "/test"
        }
      ],
      send
    );

    const res = await m(new Request("http://localhost"), jest.fn());

    expect(send).toHaveBeenCalledTimes(1);
    expect(send.mock.calls[0][0].url).toEqual("http://example.com/test");
    expect(await res.text()).toEqual("test");
  });

  it("should return `next` when route is not matched", async () => {
    const send = jest.fn(async (_: Request) => new Response("test"));
    const next = jest.fn(async () => new Response("404"));

    const m = proxy(
      [
        {
          url: "http://example.com",
          path: "/foo"
        }
      ],
      send
    );

    const res = await m(new Request("http://localhost"), next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(await res.text()).toEqual("404");
  });

  it("should match specified methods", async () => {
    const send = jest.fn(async (_: Request) => new Response("test"));
    const next = jest.fn(async () => new Response("404"));

    const m = proxy(
      [
        {
          url: "http://example.com",
          methods: ["GET"]
        }
      ],
      send
    );

    const res = await m(new Request("http://localhost"), next);

    expect(next).toHaveBeenCalledTimes(0);
    expect(send).toHaveBeenCalledTimes(1);
    expect(await res.text()).toEqual("test");

    const res2 = await m(
      new Request("http://localhost", { method: "POST" }),
      next
    );

    expect(next).toHaveBeenCalledTimes(1);
    expect(send).toHaveBeenCalledTimes(1);
    expect(await res2.text()).toEqual("404");
  });

  it("should rewrite paths", async () => {
    const send = jest.fn(async (req: Request) => new Response(req.url));

    const m = proxy(
      [
        {
          url: "http://example.com",
          path: "/:id",
          newPath: "/test/$1"
        }
      ],
      send
    );

    const res = await m(
      new Request("http://localhost/123?test=true"),
      jest.fn()
    );

    expect(send).toHaveBeenCalledTimes(1);
    expect(await res.text()).toEqual("http://example.com/test/123?test=true");
  });
});
