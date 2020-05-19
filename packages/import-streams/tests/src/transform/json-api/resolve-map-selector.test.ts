import nock from "nock";
import resolveMapSelector, {
  ResolveMapSelectorOptions,
} from "../../../../src/transform/json-api/resolve-map-selector";
import transforms from "../../../../src/transform/index";

const context = {
  transforms,
};

describe("JSON:API Resolve Map Selector", () => {
  test("on array data", async () => {
    nock("https://www.example.com:443", {
      encodedQueryParams: true,
    })
      .get("/jsonapi")
      .reply(
        200,
        {
          jsonapi: {
            version: "1.0",
            meta: {
              links: { self: { href: "http://jsonapi.org/format/1.0/" } },
            },
          },
          data: [{ foo: "bar-1" }, { foo: "bar-2" }],
          links: {
            next: {
              href: "https://www.example.com/jsonapi-2",
            },
          },
        },
        ["Content-Type", "application/vnd.api+json"]
      );

    nock("https://www.example.com:443", {
      encodedQueryParams: true,
    })
      .get("/jsonapi-2")
      .reply(
        200,
        {
          jsonapi: {
            version: "1.0",
            meta: {
              links: { self: { href: "http://jsonapi.org/format/1.0/" } },
            },
          },
          data: [{ foo: "bar-3" }, { foo: "bar-4" }, { foo: "bar-5" }],
          links: {
            next: {},
          },
        },
        ["Content-Type", "application/vnd.api+json"]
      );

    const options: ResolveMapSelectorOptions = {
      href: "https://www.example.com/jsonapi",
      context,
      limit: 3,
      mapping: {
        fubar: "foo",
      },
    };
    const result = await resolveMapSelector(null, options);

    expect(result.length).toBe(3);
    expect(result).toMatchObject([
      {
        fubar: "bar-1",
      },
      { fubar: "bar-2" },
      { fubar: "bar-3" },
    ]);
  });

  test("on data", async () => {
    nock("https://www.example.com:443", {
      encodedQueryParams: true,
    })
      .get("/jsonapi")
      .reply(
        200,
        {
          jsonapi: {
            version: "1.0",
            meta: {
              links: { self: { href: "http://jsonapi.org/format/1.0/" } },
            },
          },
          data: { foo: "bar-1" },
          links: {
            next: {},
          },
        },
        ["Content-Type", "application/vnd.api+json"]
      );

    const options: ResolveMapSelectorOptions = {
      href: "https://www.example.com/jsonapi",
      iterate: false,
      context,
      mapping: {
        fubar: "foo",
      },
    };
    const result = await resolveMapSelector(null, options);

    expect(result).toMatchObject({
      fubar: "bar-1",
    });
  });
});