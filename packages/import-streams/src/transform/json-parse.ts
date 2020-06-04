import { Transform } from "readable-stream";
import { TransformOptions, Callback } from "../types";
import { assertValidTransformOptions } from "../assertions";

interface ParseOptions extends TransformOptions {
  useUndefinedOnError?: boolean;
}

class Parse extends Transform {
  private useDebug: boolean;
  private useUndefinedOnError: boolean;

  constructor(options: ParseOptions) {
    super({ objectMode: true });

    const { debug = false } = options || {};

    this.useDebug = debug;
    this.useUndefinedOnError = options.useUndefinedOnError === true;
  }

  _transform(chunk: any, _: string, cb: Callback) {
    try {
      this.push(JSON.parse(chunk));
      cb();
    } catch (e) {
      if (this.useDebug === true) {
        console.error(e);
      }
      if (this.useUndefinedOnError) {
        this.push(undefined);
        cb();
      } else {
        cb(e);
      }
    }
  }
}

export default Parse;
