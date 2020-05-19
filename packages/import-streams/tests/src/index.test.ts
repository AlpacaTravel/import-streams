import {
  transforms as modTransforms,
  createSyncExternalItemsWriteStream,
  createJsonApiDataReadStream,
  createMapSelectorTransformStream,
} from "../../src/index";
import { TransformFunctions } from "../../src/types";
import { Readable, Writable } from "stream";

describe("module", () => {
  test("named exports", () => {
    expect(typeof createSyncExternalItemsWriteStream).toBe("function");
    expect(typeof createJsonApiDataReadStream).toBe("function");
    expect(typeof createMapSelectorTransformStream).toBe("function");
    expect(typeof modTransforms).toBe("object");
  });

  test("exports for transforms", () => {
    // Should export required functions
    const transforms: TransformFunctions = modTransforms;
    expect(typeof transforms.boolean).toBe("function");
    expect(typeof transforms.date).toBe("function");
    expect(typeof transforms.flatten).toBe("function");
    expect(typeof transforms["html-prettier"]).toBe("function");
    expect(typeof transforms["html-sanitize"]).toBe("function");
    expect(typeof transforms["map-selector"]).toBe("function");
    expect(typeof transforms.number).toBe("function");
    expect(typeof transforms.position).toBe("function");
    expect(typeof transforms.replace).toBe("function");
    expect(typeof transforms.selector).toBe("function");
    expect(typeof transforms.text).toBe("function");
    expect(typeof transforms.transform).toBe("function");
    expect(typeof transforms.truncate).toBe("function");
    expect(typeof transforms.url).toBe("function");
    expect(
      typeof transforms["drupal.field-types.json-api.entity-reference"]
    ).toBe("function");
    expect(typeof transforms["drupal.field-types.json-api.image"]).toBe(
      "function"
    );
    expect(typeof transforms["drupal.field-types.address-field"]).toBe(
      "function"
    );
    expect(typeof transforms["drupal.field-types.boolean"]).toBe("function");
    expect(typeof transforms["drupal.field-types.email"]).toBe("function");
    expect(typeof transforms["drupal.field-types.geofield"]).toBe("function");
    expect(typeof transforms["drupal.field-types.link"]).toBe("function");
    expect(typeof transforms["drupal.field-types.telephone"]).toBe("function");
    expect(typeof transforms["drupal.field-types.text-formatted"]).toBe(
      "function"
    );
    expect(typeof transforms["drupal.field-types.text-plain"]).toBe("function");
    expect(typeof transforms["json-api.resolve-map-selector"]).toBe("function");
  });

  test("use case example", async () => {
    const records: any[] = [];

    const read = new Readable({
      objectMode: true,
      read() {
        this.push({
          foo: "alpaca.travel",
        });
        this.push(null);
      },
    });

    const write = new Writable({
      objectMode: true,
      write(chunk, encoding, callback) {
        records.push(chunk);
        callback();
      },
    });

    await new Promise((success) => {
      read
        .pipe(
          createMapSelectorTransformStream({
            mapping: {
              fubar: {
                selector: ["not-here", "foo"],
                transform: [
                  {
                    type: "url",
                  },
                ],
              },
            },
            context: { transforms: modTransforms },
          })
        )
        .pipe(write)
        .on("finish", success);
    });

    expect(records).toMatchObject([{ fubar: "http://alpaca.travel" }]);
  });
});
