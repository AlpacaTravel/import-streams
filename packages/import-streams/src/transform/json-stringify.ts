import { Transform } from "readable-stream";
import { TransformOptions, Callback } from "../types";

interface StringifyOptions extends TransformOptions {
  space?: number;
}

class Stringify extends Transform {
  private space: number;

  constructor(options: StringifyOptions) {
    super({ objectMode: true });

    if (options != null && options.space) {
      this.space = options.space;
    } else {
      this.space = 0;
    }
  }

  _transform(chunk: any, _: string, cb: Callback) {
    this.push(JSON.stringify(chunk, null, this.space));
    cb();
  }
}

export default Stringify;
