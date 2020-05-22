import { Transform } from "readable-stream";
import { TransformOptions, Callback } from "../types";

class Concat extends Transform {
  private all: any[];

  constructor(options: TransformOptions) {
    super({ objectMode: true });
    this.all = [];
  }

  _transform(chunk: any, _: string, cb: Callback) {
    if (Array.isArray(chunk)) {
      this.all.push(...chunk);
    } else {
      this.all.push(chunk);
    }
    cb();
  }

  _flush(cb: Callback) {
    this.push(this.all);
    cb();
  }
}

export default Concat;
