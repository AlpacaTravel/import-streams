import { Readable, Writable } from "readable-stream";
import Parse from "../../../src/transform/uri-parse";
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
    const parse = () => new Parse({ context });

    let results: any[] = [];

    const read = () =>
      new Readable({
        objectMode: true,
        read() {
          this.push("https://alpaca.travel/example");
          this.push(null);
        },
      });

    const write = () => {
      results = [];
      return new Writable({
        objectMode: true,
        write(chunk: any, _: string, cb) {
          results.push(chunk);
          cb();
        },
      });
    };

    await new Promise((success, fail) => {
      read()
        .pipe(parse())
        .pipe(write())
        .on("finish", success)
        .on("error", fail);
    });

    expect(results).toMatchObject([
      { scheme: "https", host: "alpaca.travel", path: "/example" },
    ]);
  });
});
