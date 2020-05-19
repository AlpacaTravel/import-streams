import compose, {
  StreamFactory,
  StreamDefinition,
  SupportedStream,
} from "../../src/index";
import { Readable, Transform, Writable } from "readable-stream";

describe("", () => {
  test("exports", () => {
    expect(typeof compose).toBe("function");
  });

  test("basic composition", async () => {
    const values: number[] = [];
    const factory: StreamFactory = (
      definition: StreamDefinition
    ): SupportedStream => {
      const { type } = definition;
      switch (type) {
        case "number": {
          return new Readable({
            objectMode: true,
            read() {
              this.push(1);
              this.push(null);
            },
          });
        }

        case "add1": {
          return new Transform({
            objectMode: true,
            transform(chunk: number, enc: string, callback) {
              this.push(chunk + 1);
              callback();
            },
          });
        }

        case "catch": {
          return new Writable({
            objectMode: true,
            write(chunk: number, enc: string, callback) {
              values.push(chunk);
              callback();
            },
          });
        }

        default:
          break;
      }

      throw new Error("Type not mapped");
    };

    const definition = {
      stream: [
        {
          combine: [
            {
              stream: [
                {
                  type: "number",
                },
                {
                  type: "add1",
                },
              ],
            },
            {
              stream: [
                {
                  type: "number",
                },
                {
                  type: "add1",
                },
                {
                  type: "add1",
                },
              ],
            },
          ],
        },
        {
          type: "catch",
        },
      ],
    };

    await new Promise((success) =>
      compose(definition, { factory }).on("finish", success)
    );

    expect(values).toMatchObject([2, 3]);
  });
});
