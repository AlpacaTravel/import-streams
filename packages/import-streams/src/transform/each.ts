import { Transform } from "readable-stream";
import { TransformOptions, Callback } from "../types";

class Each extends Transform {
  constructor(options: TransformOptions) {
    super({ objectMode: true });
  }

  _transform(chunk: any, _: string, cb: Callback) {
    if (Array.isArray(chunk)) {
      chunk.forEach((element) => this.push(element));
    }
    cb();
  }
}

export default Each;
