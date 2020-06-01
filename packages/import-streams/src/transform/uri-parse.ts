import { Transform } from "readable-stream";
import { TransformOptions, Callback } from "../types";
import * as URI from "uri-js";

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
      const uri = URI.parse(chunk);

      this.push(uri);
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
