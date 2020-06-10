import { Readable, Writable } from "readable-stream";
import nock from "nock";
import JsonSchemaValidate from "../../../src/transform/json-schema-validate";

import { createCompose, transforms } from "../../../src/index";
import { ComposeContext } from "../../../src/types";

const createdCompose = createCompose();

const context: ComposeContext = {
  compose: createdCompose,
};

describe("Json Schema Validate", () => {
  test("exports", () => {
    expect(typeof transforms["json-schema-validate"]).toBe("function");
  });

  test("with manual definition of schema", async () => {
    const parse = () =>
      new JsonSchemaValidate({
        definition: {
          $id: "https://example.com/person.schema.json",
          $schema: "http://json-schema.org/draft-07/schema#",
          title: "Person",
          type: "object",
          properties: {
            firstName: {
              type: "string",
              description: "The person's first name.",
            },
            lastName: {
              type: "string",
              description: "The person's last name.",
            },
            age: {
              description:
                "Age in years which must be equal to or greater than zero.",
              type: "integer",
              minimum: 0,
            },
          },
        },
        filter: true,
        context,
      });

    let results: any[] = [];

    const inputs = [
      {
        firstName: "John",
        lastName: "Doe",
        age: 21,
      },
      {
        firstName: "Cam",
        lastName: "Dragon",
        age: -1,
      },
    ];

    const read = () =>
      new Readable({
        objectMode: true,
        read() {
          this.push(inputs.pop());
          if (!inputs.length) {
            this.push(null);
          }
        },
      });

    const write = () => {
      results = [];
      return new Writable({
        objectMode: true,
        write(chunk: any, _: string, cb) {
          results.push(chunk);
          cb();
        },
      });
    };

    await new Promise((success, fail) => {
      read()
        .pipe(parse())
        .pipe(write())
        .on("finish", success)
        .on("error", fail);
    });

    expect(results.length).toBe(1);
    expect(results).toMatchObject([
      {
        firstName: "John",
        lastName: "Doe",
        age: 21,
      },
    ]);
  });

  test("with remote definition of schema", async () => {
    const parse = () =>
      new JsonSchemaValidate({
        filter: true,
        path: "wrapped",
        context,
      });

    nock("http://schemas.com")
      .get("/person.schema.json")
      .reply(
        200,
        {
          $id: "https://example.com/person.schema.json",
          $schema: "http://json-schema.org/draft-07/schema#",
          title: "Person",
          type: "object",
          properties: {
            firstName: {
              type: "string",
              description: "The person's first name.",
            },
            lastName: {
              type: "string",
              description: "The person's last name.",
            },
            age: {
              description:
                "Age in years which must be equal to or greater than zero.",
              type: "integer",
              minimum: 0,
            },
          },
        },
        ["Content-Type", "application/json"]
      );

    let results: any[] = [];

    const inputs = [
      {
        wrapped: {
          $schema: "http://schemas.com/person.schema.json",
          firstName: "John",
          lastName: "Doe",
          age: 21,
        },
      },
      {
        wrapped: {
          $schema: "http://schemas.com/person.schema.json",
          firstName: "Cam",
          lastName: "Dragon",
          age: -1,
        },
      },
    ];

    const read = () =>
      new Readable({
        objectMode: true,
        read() {
          this.push(inputs.pop());
          if (!inputs.length) {
            this.push(null);
          }
        },
      });

    const write = () => {
      results = [];
      return new Writable({
        objectMode: true,
        write(chunk: any, _: string, cb) {
          results.push(chunk);
          cb();
        },
      });
    };

    await new Promise((success, fail) => {
      read()
        .pipe(parse())
        .pipe(write())
        .on("finish", success)
        .on("error", fail);
    });

    expect(results.length).toBe(1);
    expect(results).toMatchObject([
      {
        wrapped: { firstName: "John", lastName: "Doe", age: 21 },
      },
    ]);
  });
});
