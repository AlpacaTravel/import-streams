import nock from "nock";

import compose, {
  createCompose,
  transforms,
  createJourneyReadStream,
  createFetchObjectStream,
  createSyncExternalItemsWriteStream,
  createJsonApiDataReadStream,
  createMapSelectorTransformStream,
} from "../../src/index";
import { TransformReferences } from "../../src/types";
import { Readable, Writable } from "readable-stream";
import {
  StreamFactory,
  SupportedStream,
} from "@alpaca-travel/import-streams-compose";

describe("module", () => {
  test("named exports", () => {
    expect(typeof compose).toBe("function");
    expect(typeof createCompose).toBe("function");
    expect(typeof createSyncExternalItemsWriteStream).toBe("function");
    expect(typeof createJsonApiDataReadStream).toBe("function");
    expect(typeof createFetchObjectStream).toBe("function");
    expect(typeof createJourneyReadStream).toBe("function");
    expect(typeof createMapSelectorTransformStream).toBe("function");
    expect(typeof transforms).toBe("object");
  });

  test("exports for transforms", () => {
    // Should export required functions
    const exportedTransforms: TransformReferences = transforms;
    expect(typeof exportedTransforms.boolean).toBe("function");
    expect(typeof exportedTransforms.date).toBe("function");
    expect(typeof exportedTransforms.flatten).toBe("function");
    expect(typeof exportedTransforms["html-prettier"]).toBe("function");
    expect(typeof exportedTransforms["html-sanitize"]).toBe("function");
    expect(typeof exportedTransforms["map-selector"]).toBe("function");
    expect(typeof exportedTransforms.number).toBe("function");
    expect(typeof exportedTransforms.concat).toBe("function");
    expect(typeof exportedTransforms["resolve-fetch-object"]).toBe("function");
    expect(typeof exportedTransforms["resolve-journey"]).toBe("function");
    expect(typeof exportedTransforms["json-stringify"]).toBe("function");
    expect(typeof exportedTransforms["console"]).toBe("function");
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

  test("use case example of a composed document", async () => {
    let output = null;
    const factory: StreamFactory = ({
      type,
    }: {
      type: string;
    }): SupportedStream | null | undefined => {
      if (type === "fus") {
        return new Readable({
          objectMode: true,
          read() {
            this.push("fubar.com");
            this.push("fubar.com");
            this.push(null);
          },
        });
      }
      if (type === "fu") {
        return new Readable({
          objectMode: true,
          read() {
            this.push("fubar.com");
            this.push(null);
          },
        });
      }
      if (type === "write") {
        output = null;
        return new Writable({
          objectMode: true,
          write(chunk, _, callback) {
            output = chunk;
            callback();
          },
        });
      }
      if (type === "append") {
        output = [];
        return new Writable({
          objectMode: true,
          write(chunk, _, callback) {
            output.push(chunk);
            callback();
          },
        });
      }
      return null;
    };

    const doc1 = `
version: 1.0
stream:
  - fu
  - url
  - write
`;

    await new Promise((success, err) => {
      compose(doc1, { factory }).on("finish", success).on("error", err);
    });

    expect(output).toBe("http://fubar.com");

    const doc2 = `
version: 1.0
stream:
  - fus
  - url
  - concat
  - write
`;

    await new Promise((success, err) => {
      compose(doc2, { factory }).on("finish", success).on("error", err);
    });

    expect(output).toMatchObject(["http://fubar.com", "http://fubar.com"]);

    const csv = `"Month", "1958", "1959", "1960"
"JAN",  340,  360,  417
"FEB",  318,  342,  391
"MAR",  362,  406,  419
"APR",  348,  396,  461
"MAY",  363,  420,  472
"JUN",  435,  472,  535
"JUL",  491,  548,  622
"AUG",  505,  559,  606
"SEP",  404,  463,  508
"OCT",  359,  407,  461
"NOV",  310,  362,  390
"DEC",  337,  405,  432`;

    nock("https://www.example.com:443")
      .get("/example.csv")
      .reply(200, csv, ["Content-Type", "text/plain; charset=UTF-8"]);

    const doc3 = `
version: 1.0
stream:
  - type: fetch-stream
    options:
      url: https://www.example.com/example.csv
  - type: csv-parse
    options:
      columns: true
      quote: '"'
      ltrim: true
      rtrim: true
      delimiter: ,
  - append
`;

    await new Promise((success, err) => {
      compose(doc3, { factory }).on("finish", success).on("error", err);
    });

    expect(output).toMatchObject([
      { "1958": "340", "1959": "360", "1960": "417", Month: "JAN" },
      { "1958": "318", "1959": "342", "1960": "391", Month: "FEB" },
      { "1958": "362", "1959": "406", "1960": "419", Month: "MAR" },
      { "1958": "348", "1959": "396", "1960": "461", Month: "APR" },
      { "1958": "363", "1959": "420", "1960": "472", Month: "MAY" },
      { "1958": "435", "1959": "472", "1960": "535", Month: "JUN" },
      { "1958": "491", "1959": "548", "1960": "622", Month: "JUL" },
      { "1958": "505", "1959": "559", "1960": "606", Month: "AUG" },
      { "1958": "404", "1959": "463", "1960": "508", Month: "SEP" },
      { "1958": "359", "1959": "407", "1960": "461", Month: "OCT" },
      { "1958": "310", "1959": "362", "1960": "390", Month: "NOV" },
      { "1958": "337", "1959": "405", "1960": "432", Month: "DEC" },
    ]);
  });
});
