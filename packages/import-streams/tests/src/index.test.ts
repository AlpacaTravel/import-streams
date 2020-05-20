import compose, {
  createCompose,
  transforms,
  createSyncExternalItemsWriteStream,
  createJsonApiDataReadStream,
  createMapSelectorTransformStream,
} from "../../src/index";
import { TransformFunctions } from "../../src/types";
import { Readable, Writable } from "stream";

describe("module", () => {
  test("named exports", () => {
    expect(typeof compose).toBe("function");
    expect(typeof createCompose).toBe("function");
    expect(typeof createSyncExternalItemsWriteStream).toBe("function");
    expect(typeof createJsonApiDataReadStream).toBe("function");
    expect(typeof createMapSelectorTransformStream).toBe("function");
    expect(typeof transforms).toBe("object");
  });

  test("exports for transforms", () => {
    // Should export required functions
    const exportedTransforms: TransformFunctions = transforms;
    expect(typeof exportedTransforms.boolean).toBe("function");
    expect(typeof exportedTransforms.date).toBe("function");
    expect(typeof exportedTransforms.flatten).toBe("function");
    expect(typeof exportedTransforms["html-prettier"]).toBe("function");
    expect(typeof exportedTransforms["html-sanitize"]).toBe("function");
    expect(typeof exportedTransforms["map-selector"]).toBe("function");
    expect(typeof exportedTransforms.number).toBe("function");
    expect(typeof exportedTransforms.position).toBe("function");
    expect(typeof exportedTransforms.replace).toBe("function");
    expect(typeof exportedTransforms.selector).toBe("function");
    expect(typeof exportedTransforms.text).toBe("function");
    expect(typeof exportedTransforms.truncate).toBe("function");
    expect(typeof exportedTransforms.url).toBe("function");
    expect(
      typeof exportedTransforms["drupal.field-types.json-api.entity-reference"]
    ).toBe("function");
    expect(typeof exportedTransforms["drupal.field-types.json-api.image"]).toBe(
      "function"
    );
    expect(typeof exportedTransforms["drupal.field-types.address-field"]).toBe(
      "function"
    );
    expect(typeof exportedTransforms["drupal.field-types.boolean"]).toBe(
      "function"
    );
    expect(typeof exportedTransforms["drupal.field-types.email"]).toBe(
      "function"
    );
    expect(typeof exportedTransforms["drupal.field-types.geofield"]).toBe(
      "function"
    );
    expect(typeof exportedTransforms["drupal.field-types.link"]).toBe(
      "function"
    );
    expect(typeof exportedTransforms["drupal.field-types.telephone"]).toBe(
      "function"
    );
    expect(typeof exportedTransforms["drupal.field-types.text-formatted"]).toBe(
      "function"
    );
    expect(typeof exportedTransforms["drupal.field-types.text-plain"]).toBe(
      "function"
    );
    expect(typeof exportedTransforms["json-api.resolve-map-selector"]).toBe(
      "function"
    );
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
            context: { compose: createCompose() },
          })
        )
        .pipe(write)
        .on("finish", success);
    });

    expect(records).toMatchObject([{ fubar: "http://alpaca.travel" }]);
  });
});
