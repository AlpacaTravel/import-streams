import nock from "nock";
import { createWriteStream } from "../../../src/write/alpaca-sync-external-items";
import { Readable } from "readable-stream";

describe("alpaca-sync-external-items", () => {
  test("correctly settles a collection", async () => {
    // The current items collection on the server
    const currentItems = [
      {
        $ref: "alpaca://item/123",
        created: new Date("2020-01-01"),
        modified: new Date("2020-02-01"),
        attributes: [
          { attribute: { $ref: "custom://external-ref" }, value: "a" },
          {
            attribute: {
              $ref: "custom://external-source",
            },
            value: "https://www.example.com",
          },
        ],
      },
      {
        $ref: "alpaca://item/abc123",
        created: new Date("2020-01-01"),
        modified: new Date("2020-02-01"),
      },
      {
        $ref: "alpaca://item/234",
        created: new Date("2020-01-01"),
        modified: new Date("2020-02-01"),
        attributes: [
          { attribute: { $ref: "custom://external-ref" }, value: "b" },
          {
            attribute: {
              $ref: "custom://external-source",
            },
            value: "https://www.example.com",
          },
        ],
      },
      {
        $ref: "alpaca://item/345",
        created: new Date("2020-01-01"),
        modified: new Date("2020-02-01"),
        attributes: [
          { attribute: { $ref: "custom://external-ref" }, value: "c" },
          {
            attribute: {
              $ref: "custom://external-source",
            },
            value: "https://www.othersite.com",
          },
        ],
      },
      {
        $ref: "alpaca://item/456",
        created: new Date("2020-01-01"),
        modified: new Date("2020-05-01"),
        attributes: [
          { attribute: { $ref: "custom://external-ref" }, value: "e" },
          {
            attribute: {
              $ref: "custom://external-source",
            },
            value: "https://www.example.com",
          },
        ],
      },
    ];

    // Nock to capture checking the collection
    nock("https://withalpaca.com:443", { encodedQueryParams: true })
      .get("/api/v2/item")
      .query({
        collection: "alpaca%3A%2F%2Fcollection%2F123",
        profile: "alpaca%3A%2F%2Fprofile%2F123",
        limit: "100",
        offset: "0",
        accessToken: "sk.123",
      })
      .reply(200, { results: currentItems, total: currentItems.length }, [
        "Content-Type",
        "application/json",
      ]);

    const mergeItem = {
      $schema: "https://schemas.alpaca.travel/item-v1.0.0.schema.json",
      $id: "item/234",
      title: "existing sync",
      modified: new Date("2020-02-02"),
      attributes: [
        {
          attribute: {
            $ref: "custom://external-ref",
          },
          value: "e",
        },
        {
          attribute: {
            $ref: "custom://external-source",
          },
          value: "https://www.example.com",
        },
        {
          attribute: {
            $ref: "custom://something-existing",
          },
          value: "retained",
        },
      ],
    };

    // The items witnessed
    const streamedItems = [
      {
        $schema: "https://schemas.alpaca.travel/item-v1.0.0.schema.json",
        title: "example 1",
        modified: new Date("2020-02-02"),
        attributes: [
          {
            attribute: {
              $ref: "custom://external-ref",
            },
            value: "a",
          },
          {
            attribute: {
              $ref: "custom://external-source",
            },
            value: "https://www.example.com",
          },
        ],
      },
      {
        $schema: "https://schemas.alpaca.travel/item-v1.0.0.schema.json",
        title: "new",
        modified: new Date("2020-02-02"),
        attributes: [
          {
            attribute: {
              $ref: "custom://external-ref",
            },
            value: "d",
          },
          {
            attribute: {
              $ref: "custom://external-source",
            },
            value: "https://www.example.com",
          },
        ],
      },
      {
        $schema: "https://schemas.alpaca.travel/item-v1.0.0.schema.json",
        title: "existing sync",
        modified: new Date("2020-02-02"),
        attributes: [
          {
            attribute: {
              $ref: "custom://external-ref",
            },
            value: "e",
          },
          {
            attribute: {
              $ref: "custom://external-source",
            },
            value: "https://www.example.com",
          },
        ],
      },
    ];

    nock("https://withalpaca.com:443", { encodedQueryParams: true })
      .get("/api/v2/item/123")
      .query({
        accessToken: "sk.123",
      })
      .reply(200, { ...streamedItems[0], $ref: "alpaca://item/123" }, [
        "Content-Type",
        "application/json",
      ]);

    // Get's item 234 to merge the "import not present"
    nock("https://withalpaca.com:443", { encodedQueryParams: true })
      .get("/api/v2/item/234")
      .query({
        accessToken: "sk.123",
      })
      .reply(200, mergeItem, ["Content-Type", "application/json"]);

    // Should put the item with import present
    nock("https://withalpaca.com:443", { encodedQueryParams: true })
      .put("/api/v2/item/123/publish", (body) => {
        expect(body.title).toBe("example 1");
        expect(
          body.attributes.find(
            (attr: any) =>
              attr.attribute.$ref === "custom://import-present" &&
              attr.value === true
          )
        ).not.toBeUndefined();
        return true;
      })
      .query({
        accessToken: "sk.123",
      })
      .reply(200, {}, ["Content-Type", "application/json"]);

    // Should push with import not present
    nock("https://withalpaca.com:443", { encodedQueryParams: true })
      .put("/api/v2/item/234/publish", (body) => {
        expect(
          body.attributes.find(
            (attr: any) =>
              attr.attribute.$ref === "custom://import-present" &&
              attr.value === false
          )
        ).not.toBeUndefined();
        expect(
          body.attributes.find(
            (attr: any) =>
              attr.attribute.$ref === "custom://something-existing" &&
              attr.value === "retained"
          )
        ).not.toBeUndefined();
        return true;
      })
      .query({
        accessToken: "sk.123",
      })
      .reply(200, {}, ["Content-Type", "application/json"]);

    nock("https://withalpaca.com:443", { encodedQueryParams: true })
      .post("/api/v2/item", (body) => {
        if (
          body.attributes.find(
            (attr: any) =>
              attr.attribute.$ref === "custom://external-ref" &&
              attr.value === "d"
          )
        ) {
          expect(body.title).toBe("new");
          expect(
            body.attributes.find(
              (attr: any) =>
                attr.attribute.$ref === "custom://import-present" &&
                attr.value === true
            )
          ).not.toBeUndefined();
          return true;
        }
        return false;
      })
      .query({
        accessToken: "sk.123",
      })
      .reply(201, {}, ["Content-Type", "application/json"]);

    // The read stream, streaming items to sync
    const readStream = new Readable({
      objectMode: true,
      read() {
        this.push(streamedItems.pop());
        if (!streamedItems.length) {
          this.push(null);
        }
      },
    });

    // Our write stream we are interrogating
    const writeStream = createWriteStream({
      apiKey: "sk.123",
      collection: "alpaca://collection/123",
      profile: "alpaca://profile/123",
      wait: 100,
      retry: 1,
      externalSource: "https://www.example.com",
    });

    // Allow the process to complete or fail
    await new Promise((success, fail) => {
      readStream.pipe(writeStream).on("finish", success).on("error", fail);
    });
  });
});
