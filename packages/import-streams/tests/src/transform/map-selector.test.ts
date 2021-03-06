import { Readable, Writable } from "stream";
import {
  createTransformStream,
  MapSelectorOptions,
} from "../../../src/transform/map-selector";
import { createCompose } from "../../../src/index";
import { ComposeContext } from "../../../src/types";

const createdCompose = createCompose();

const context: ComposeContext = {
  compose: createdCompose,
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

  test("createTransformStream modifying original value", async () => {
    const options: MapSelectorOptions = {
      mapping: {
        "something.else": "foo",
        "custom://value": "fubar",
        "custom://example": "foo",
      },
      useValueAsTemplate: true,
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
        this.push({
          foo: "bar",
          fubar: "custom-value",
          attributes: [
            { attribute: { $ref: "custom://example" }, value: "fooo" },
          ],
        });
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
        foo: "bar",
        fubar: "custom-value",
        something: {
          else: "bar",
        },
        attributes: [
          { attribute: { $ref: "custom://value" }, value: "custom-value" },
          { attribute: { $ref: "custom://example" }, value: "bar" },
        ],
      },
    ]);
  });
});
