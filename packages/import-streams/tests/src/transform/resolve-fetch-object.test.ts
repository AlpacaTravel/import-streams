import nock from "nock";
import resolveFetchObject, {
  ResolveFetchObjectOptions,
} from "../../../src/transform/resolve-fetch-object";
import { createCompose } from "../../../src/index";

const compose = createCompose();
const context = {
  compose,
};

describe("Ressolve HTTP Request", () => {
  test("on array data", async () => {
    nock("https://www.example.com:443", {
      encodedQueryParams: true,
    })
      .get("/records")
      .reply(
        200,
        {
          results: [{ foo: "bar-1" }, { foo: "bar-2" }],
        },
        ["Content-Type", "application/json"]
      );

    const options: ResolveFetchObjectOptions = {
      context,
      mapping: {
        fubar: "foo",
      },
      request: {
        path: "results",
        iterate: true,
      },
    };
    const result = await resolveFetchObject(
      "https://www.example.com/records",
      options
    );

    expect(result.length).toBe(2);
    expect(result).toMatchObject([
      {
        fubar: "bar-1",
      },
      { fubar: "bar-2" },
    ]);
  });

  test("on bad response", async () => {
    nock("https://www.example.com:443", {
      encodedQueryParams: true,
    })
      .get("/records")
      .reply(500);

    const options: ResolveFetchObjectOptions = {
      context,
      mapping: {
        fubar: "foo",
      },
      request: {
        retry: 1,
        wait: 200,
      },
      useUndefinedOnError: true,
    };
    const result = await resolveFetchObject(
      "https://www.example.com/records",
      options
    );

    expect(result).toBeUndefined();
  });
});
