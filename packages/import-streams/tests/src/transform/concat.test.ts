import { Readable, Writable } from "readable-stream";
import Concat from "../../../src/transform/concat";

import { createCompose } from "../../../src/index";
import { ComposeContext } from "../../../src/types";

const createdCompose = createCompose();

const context: ComposeContext = {
  compose: createdCompose,
};

describe("Concat", () => {
  test("a contenation", async () => {
    const concat = () => new Concat({ context });

    let results: any[] = [];

    const read = (arr: boolean) =>
      new Readable({
        objectMode: true,
        read() {
          if (arr === true) {
            this.push([1, 2, 3]);
            this.push([4, 5, 6]);
          } else {
            this.push(1);
            this.push(2);
            this.push(3);
            this.push(4);
          }
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
      read(true)
        .pipe(concat())
        .pipe(write())
        .on("finish", success)
        .on("error", fail);
    });

    expect(results).toMatchObject([[1, 2, 3, 4, 5, 6]]);

    await new Promise((success, fail) => {
      read(false)
        .pipe(concat())
        .pipe(write())
        .on("finish", success)
        .on("error", fail);
    });

    expect(results).toMatchObject([[1, 2, 3, 4]]);
  });
});
