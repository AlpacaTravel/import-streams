import { createReadStream } from "../../../src/read/sqlite-statement-read";
import { Writable } from "readable-stream";

describe("sqlite-statement-read", () => {
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
      sql: "SELECT * FROM test",
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
