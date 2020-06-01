import { Transform } from "readable-stream";
import { TransformOptions, Callback } from "../types";
import { assertValidTransformOptions } from "../assertions";

interface ParseOptions extends TransformOptions {}

class Parse extends Transform {
  private useDebug: boolean;

  constructor(options: ParseOptions) {
    super({ objectMode: true });

    const { debug = false } = options || {};

    this.useDebug = debug;
  }

  _transform(chunk: any, _: string, cb: Callback) {
    try {
      this.push(JSON.parse(chunk));
      cb();
    } catch (e) {
      if (this.useDebug === true) {
        console.error(e);
      }
      cb(e);
    }
  }
}

export default Parse;
