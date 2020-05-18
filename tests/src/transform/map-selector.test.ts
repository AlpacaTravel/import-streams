import { Readable, Writable } from "stream";
import {
  createTransformStream,
  MapSelectorOptions,
} from "../../../src/transform/map-selector";
import transforms from "../../../src/transform/index";

const context = {
  transforms,
};

describe("Map Selector", () => {
  test("createTransformStream", async () => {
    const options: MapSelectorOptions = {
      mapping: {
        fubar: "foo",
        "something.else": "foo",
        "custom://value": "fubar",
      },
      context,
    };
    const result: Array<any> = [];
    const collator = new Writable({
      objectMode: true,
      write(chunk, _, callback) {
        result.push(chunk);
        callback();
      },
    });
    const stream = createTransformStream(options);

    const readable = new Readable({
      objectMode: true,
      read() {
        this.push({ foo: "bar", fubar: "custom-value" });
        this.push(null);
      },
    });

    await new Promise((success, err) => {
      readable
        .pipe(stream)
        .on("error", err)
        .pipe(collator)
        .on("finish", success)
        .on("error", err);
    });

    expect(result).toMatchObject([
      {
        fubar: "bar",
        something: {
          else: "bar",
        },
        attributes: [
          { attribute: { $ref: "custom://value" }, value: "custom-value" },
        ],
      },
    ]);
  });
});
