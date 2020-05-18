import nock from "nock";
import entityReference from "../../../../../../src/transform/drupal/field-types/json-api/entity-reference";
import transforms from "../../../../../../src/transform";

describe("Entity Reference", () => {
  test("With basic value", async () => {
    nock("https://www.example.com:443", {
      encodedQueryParams: true,
    })
      .get("/jsonapi/type/1")
      .reply(
        200,
        {
          jsonapi: {
            version: "1.0",
            meta: {
              links: { self: { href: "http://jsonapi.org/format/1.0/" } },
            },
          },
          data: {
            bar: "fubar",
          },
        },
        ["Content-Type", "application/vnd.api+json"]
      );

    const value = {
      data: {},
      links: {
        related: {
          href: "https://www.example.com/jsonapi/type/1",
        },
      },
    };

    const options = {
      mapping: {
        foo: "bar",
      },
      context: {
        transforms,
      },
    };

    expect(await entityReference(value, options)).toMatchObject([
      {
        foo: "fubar",
      },
    ]);
  });
});
