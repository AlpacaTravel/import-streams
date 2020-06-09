import { Readable, Writable } from "readable-stream";
import url from "../../../src/transform/to-url";
import Transforms from "../../../src/transform/index";

import { createCompose, transforms } from "../../../src/index";
import { ComposeContext } from "../../../src/types";

const createdCompose = createCompose();

const context: ComposeContext = {
  compose: createdCompose,
};

describe("URL", () => {
  test("exports", () => {
    expect(typeof transforms["to-url"]).toBe("function");
  });

  test("a string", async () => {
    expect(
      await url("https://alpaca.travel/example", {
        context,
      })
    ).toBe("https://alpaca.travel/example");

    expect(
      await url("alpaca.travel/example", {
        context,
      })
    ).toBe("http://alpaca.travel/example");

    expect(
      await url("https://alpaca.TRAVEL/example", {
        lowercaseHostname: true,
        context,
      })
    ).toBe("https://alpaca.travel/example");

    expect(
      await url(
        { foo: "bar" },
        {
          context,
        }
      )
    ).toBeUndefined();
  });
});
