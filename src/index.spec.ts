import { proxy } from "./index";

describe("microservice proxy", () => {
  it("should create middleware", () => {
    const m = proxy([]);

    expect(typeof m).toBe("function");
  });
});
