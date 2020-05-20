import compose, {
  StreamFactory,
  StreamDefinition,
  SupportedStream,
} from "../../src/index";
import { Readable, Transform, Writable } from "readable-stream";

const readStr = (str = "foo") => {
  return new Readable({
    objectMode: true,
    read() {
      this.push(`${str}`);
      this.push(null);
    },
  });
};
const addStr = (str = "bar") => {
  return new Transform({
    objectMode: true,
    transform(chunk: string, enc: string, callback) {
      this.push(`${chunk}${str}`);
      callback();
    },
  });
};
const write = (target: any[]) => {
  return new Writable({
    objectMode: true,
    write(chunk: number, enc: string, callback) {
      target.push(chunk);
      callback();
    },
  });
};

const createFactory = (output: string[]) => {
  const factoryMethod: StreamFactory = (definition: StreamDefinition) => {
    switch (definition.type) {
      case "foo": {
        return readStr("fu");
      }
      case "bar": {
        return addStr("bar");
      }
      case "write": {
        return write(output);
      }
      default:
        throw new Error("Unmapped");
    }
  };

  return factoryMethod;
};

describe("compose", () => {
  test("exports", () => {
    expect(typeof compose).toBe("function");
  });

  test("basic stream composition", async () => {
    const output: string[] = [];
    const factory = createFactory(output);

    await new Promise((success) =>
      compose(
        {
          stream: ["foo", "bar", "write"],
        },
        { factory }
      ).on("finish", success)
    );

    expect(output).toMatchObject(["fubar"]);
  });

  test("basic stream composition with a read source", async () => {
    const output: string[] = [];
    const factory = createFactory(output);

    await new Promise((success) =>
      compose(
        {
          stream: ["bar", "write"],
        },
        { factory, readFrom: readStr("fu") }
      ).on("finish", success)
    );

    expect(output).toMatchObject(["fubar"]);
  });

  test("recursive stream composition", async () => {
    const output: string[] = [];
    const factory = createFactory(output);

    await new Promise((success) =>
      compose(
        {
          stream: [
            {
              stream: ["foo", "bar"],
            },
            "write",
          ],
        },
        { factory }
      ).on("finish", success)
    );

    expect(output).toMatchObject(["fubar"]);
  });

  test("recursive stream composition with a read source", async () => {
    const output: string[] = [];
    const factory = createFactory(output);

    await new Promise((success) =>
      compose(
        {
          stream: [
            {
              stream: ["bar"],
            },
            "write",
          ],
        },
        { factory, readFrom: readStr("fu") }
      ).on("finish", success)
    );

    expect(output).toMatchObject(["fubar"]);
  });

  test("basic read combine composition", async () => {
    const output: string[] = [];
    const factory = createFactory(output);

    await new Promise((success) => {
      const result = compose(
        {
          combine: ["foo", "foo"],
        },
        { factory }
      );
      result.pipe(write(output)).on("finish", success);
    });

    expect(output).toMatchObject(["fu", "fu"]);
  });

  test("basic write combine composition", async () => {
    const output: string[] = [];
    const factory = createFactory(output);

    await new Promise((success) => {
      const result = compose(
        {
          combine: ["write", "write"],
        },
        { factory, readFrom: readStr("fu") }
      );
      result.on("finish", success);
    });

    expect(output).toMatchObject(["fu", "fu"]);
  });

  test("stream pipe for combine composition", async () => {
    const output: string[] = [];
    const factory = createFactory(output);

    await new Promise((success) => {
      const result = compose(
        {
          stream: [
            {
              combine: ["foo", "foo"],
            },
            "bar",
            {
              combine: ["write", "write"],
            },
          ],
        },
        { factory }
      );
      result.on("finish", success);
    });

    expect(output).toMatchObject(["fubar", "fubar", "fubar", "fubar"]);
  });

  test("stream pipe for combine with sub-streams composition with read source", async () => {
    const output: string[] = [];
    const factory = createFactory(output);

    await new Promise((success) => {
      const result = compose(
        {
          stream: [
            "bar",
            {
              combine: ["write", "write"],
            },
          ],
        },
        { factory, readFrom: readStr("fu") }
      );
      result.on("finish", success);
    });

    expect(output).toMatchObject(["fubar", "fubar"]);
  });

  test("mixed composition use case", async () => {
    const output: string[] = [];
    const factory = createFactory(output);

    const definition = {
      stream: [
        {
          combine: [
            "foo", //fu
            ["foo", "bar"], //fubar
          ],
        },
        {
          combine: [
            {
              stream: [
                {
                  type: "bar",
                },
                {
                  type: "write", //Xbar
                },
              ],
            },
            {
              type: "write", //x
            },
          ],
        },
      ],
    };

    await new Promise((success) =>
      compose(definition, { factory }).on("finish", success)
    );

    expect(output.length).toBe(4);
    expect(output.filter((f) => f === "fubar").length).toBe(2);
    expect(output.filter((f) => f === "fu").length).toBe(1);
    expect(output.filter((f) => f === "fubarbar").length).toBe(1);
  });

  test("mixed composition use case with a read source", async () => {
    const output: string[] = [];
    const factory = createFactory(output);

    const definition = {
      stream: [
        "foo",
        ["bar", "bar"],
        "write",
        // SOON
        // {
        //   combine: [
        //     {
        //       stream: [
        //         {
        //           type: "bar",
        //         },
        //         {
        //           type: "write", //Xbar
        //         },
        //       ],
        //     },
        //     {
        //       type: "write", //x
        //     },
        //   ],
        // },
      ],
    };

    await new Promise((success) =>
      compose(definition, { factory }).on("finish", success)
    );

    expect(output).toMatchObject(["fubarbar"]);

    return;
    // SOON
    expect(output.length).toBe(2);
    expect(output.filter((f) => f === "fubarbarbar").length).toBe(1);
    expect(output.filter((f) => f === "fubarbar").length).toBe(1);
  });

  test("composition stream with end result", async () => {
    const output: string[] = [];
    const factory = createFactory(output);

    const definition = {
      stream: ["bar", "bar", "bar", "write"],
    };

    await new Promise((success) =>
      compose(definition, { factory, readFrom: readStr("fu") }).on(
        "finish",
        success
      )
    );

    expect(output).toMatchObject(["fubarbarbar"]);
  });

  test("use case with streams", async () => {
    let value = null;
    const read = new Readable({
      objectMode: true,
      read() {
        this.push({ foo: "bar" });
        this.push(null);
      },
    });
    const write = new Writable({
      objectMode: true,
      write(chunk, _, callback) {
        value = chunk;
        callback();
      },
    });
    const factory: StreamFactory = (
      definition: StreamDefinition
    ): SupportedStream => {
      return read;
    };
    await new Promise((success) =>
      compose([read, write], { factory }).on("finish", success)
    );
    expect(value).toMatchObject({ foo: "bar" });
  });
});
