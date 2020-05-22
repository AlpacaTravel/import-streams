import nock from "nock";
import resolveHttpRequest, {
  ResolveHttpRequest,
} from "../../../src/transform/resolve-http-request";
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

    const options: ResolveHttpRequest = {
      context,
      mapping: {
        fubar: "foo",
      },
      request: {
        path: "results",
        iterate: true,
      },
    };
    const result = await resolveHttpRequest(
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
});
