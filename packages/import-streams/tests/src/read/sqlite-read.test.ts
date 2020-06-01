import { createReadStream } from "../../../src/read/sqlite-query";
import { Writable } from "readable-stream";

describe("sqlite-read", () => {
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
      database: "./tests/data/test.db",
      query: "SELECT * FROM test",
    });

    await new Promise((success, failure) => {
      read.pipe(writable).on("finish", success).on("error", failure);
    });

    expect(output).toMatchObject([
      { id: 1 },
      { id: 2 },
      { id: 3 },
      { id: 4 },
      { id: 5 },
    ]);
  });
});
