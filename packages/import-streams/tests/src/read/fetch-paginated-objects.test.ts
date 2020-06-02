import { Writable } from "readable-stream";
import nock from "nock";
import { createReadStream } from "../../../src/read/fetch-paginated-objects";

describe("Fetch Paginated Objects using createReadStream", () => {
  test("paging with record count offsets", async () => {
    let output: any[] = [];

    const writeStream = new Writable({
      objectMode: true,
      write(obj, _, cb) {
        output.push(obj);
        cb();
      },
    });

    nock("https://www.example.com:443")
      .get("/endpoint")
      .query({ offset: 0, limit: 5 })
      .reply(
        200,
        {
          total: 8,
          results: [
            { foo: "bar-0" },
            { foo: "bar-1" },
            { foo: "bar-2" },
            { foo: "bar-3" },
            { foo: "bar-4" },
          ],
        },
        ["Content-Type", "application/json"]
      );

    nock("https://www.example.com:443")
      .get("/endpoint")
      .query({ offset: 5, limit: 5 })
      .reply(500, { status: "error" }, ["Content-Type", "application/json"]);

    nock("https://www.example.com:443")
      .get("/endpoint")
      .query({ offset: 5, limit: 5 })
      .reply(
        200,
        {
          total: 8,
          results: [{ foo: "bar-5" }, { foo: "bar-6" }, { foo: "bar-7" }],
        },
        ["Content-Type", "application/json"]
      );

    await new Promise((success, fail) => {
      createReadStream(`https://www.example.com/endpoint`, {
        path: "results",
        pathTotalRecords: "total",
        pagesizeQueryParam: "limit",
        offsetQueryParam: "offset",
        pagesize: 5,
        wait: 100,
      })
        .pipe(writeStream)
        .on("finish", success)
        .on("error", fail);
    });

    expect(output).toMatchObject([
      { foo: "bar-0" },
      { foo: "bar-1" },
      { foo: "bar-2" },
      { foo: "bar-3" },
      { foo: "bar-4" },
      { foo: "bar-5" },
      { foo: "bar-6" },
      { foo: "bar-7" },
    ]);
  }, 10000);

  test("paginating a sample db with page query params", async () => {
    let output: any[] = [];

    const writeStream = new Writable({
      objectMode: true,
      write(obj, _, cb) {
        output.push(obj);
        cb();
      },
    });

    nock("https://www.example.com:443")
      .get("/endpoint")
      .query({ pge: 1, size: 5 })
      .reply(
        200,
        {
          total: 8,
          results: [
            { foo: "bar-0" },
            { foo: "bar-1" },
            { foo: "bar-2" },
            { foo: "bar-3" },
            { foo: "bar-4" },
          ],
        },
        ["Content-Type", "application/json"]
      );

    nock("https://www.example.com:443")
      .get("/endpoint")
      .query({ pge: 2, size: 5 })
      .reply(500, { status: "error" }, ["Content-Type", "application/json"]);

    nock("https://www.example.com:443")
      .get("/endpoint")
      .query({ pge: 2, size: 5 })
      .reply(
        200,
        {
          total: 8,
          results: [{ foo: "bar-5" }, { foo: "bar-6" }, { foo: "bar-7" }],
        },
        ["Content-Type", "application/json"]
      );

    await new Promise((success, fail) => {
      createReadStream(`https://www.example.com/endpoint`, {
        path: "results",
        pathTotalRecords: "total",
        pagesizeQueryParam: "size",
        pageQueryParam: "pge",
        pagesize: 5,
        usePageStartingAtOne: true,
        wait: 100,
      })
        .pipe(writeStream)
        .on("finish", success)
        .on("error", fail);
    });

    expect(output).toMatchObject([
      { foo: "bar-0" },
      { foo: "bar-1" },
      { foo: "bar-2" },
      { foo: "bar-3" },
      { foo: "bar-4" },
      { foo: "bar-5" },
      { foo: "bar-6" },
      { foo: "bar-7" },
    ]);
  }, 10000);
});
