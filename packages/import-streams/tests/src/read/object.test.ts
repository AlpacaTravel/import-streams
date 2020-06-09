import { createReadStream } from "../../../src/read/object";
import { Writable } from "readable-stream";

describe("object", () => {
  test("createReadStream", async () => {
    const output: any[] = [];

    const writable = new Writable({
      objectMode: true,
      write(chunk, enc, cb) {
        output.push(chunk);
        cb();
      },
    });

    const read = createReadStream({
      value: [{ foo: "bar" }, { foo: "fubar" }],
    });

    await new Promise((success, failure) => {
      read.pipe(writable).on("finish", success).on("error", failure);
    });

    expect(output).toMatchObject([{ foo: "bar" }, { foo: "fubar" }]);
  });
});
