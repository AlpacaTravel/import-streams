import { Readable, Writable } from "readable-stream";
import parse from "../../../src/transform/uri-parse";
import Transforms from "../../../src/transform/index";

import { createCompose, transforms } from "../../../src/index";
import { ComposeContext } from "../../../src/types";

const createdCompose = createCompose();

const context: ComposeContext = {
  compose: createdCompose,
};

describe("URI Parse", () => {
  test("exports", () => {
    expect(typeof transforms["uri-parse"]).toBe("function");
  });

  test("a string", async () => {
    expect(
      await parse("https://alpaca.travel/example", {
        context,
      })
    ).toMatchObject({
      scheme: "https",
      host: "alpaca.travel",
      path: "/example",
    });

    expect(
      await parse(
        { foo: "bar" },
        {
          context,
        }
      )
    ).toBeUndefined();
  });
});
