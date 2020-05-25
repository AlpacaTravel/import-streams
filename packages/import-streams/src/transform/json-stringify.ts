import { Transform } from "readable-stream";
import { TransformOptions, Callback } from "../types";
import { assertValidTransformOptions } from "../assertions";

interface StringifyOptions extends TransformOptions {
  space?: number;
}

class Stringify extends Transform {
  private space: number;
  private useDebug: boolean;

  constructor(options: StringifyOptions) {
    super({ objectMode: true });

    const { space, debug = false } = options || {};

    this.space = space ? space : 0;
    this.useDebug = debug;

    assertValidTransformOptions(options, ["space"], "stringify");
  }

  _transform(chunk: any, _: string, cb: Callback) {
    try {
      this.push(JSON.stringify(chunk, null, this.space));
      cb();
    } catch (e) {
      if (this.useDebug === true) {
        console.error(e);
      }
      cb(e);
    }
  }
}

export default Stringify;
