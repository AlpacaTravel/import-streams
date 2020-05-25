import { Transform } from "readable-stream";
import { TransformOptions, Callback } from "../types";
import { assertValidTransformOptions } from "../assertions";

interface ConsoleOptions extends TransformOptions {
  prefix?: string;
}

class Console extends Transform {
  private prefix?: string;

  constructor(options: ConsoleOptions) {
    super({ objectMode: true });

    assertValidTransformOptions(options, ["prefix"], "console");

    if (options != null && options.prefix) {
      this.prefix = options.prefix;
    }
  }

  _transform(chunk: any, _: string, cb: Callback) {
    console.log(this.prefix, chunk);
    this.push(chunk);
    cb();
  }
}

export default Console;
