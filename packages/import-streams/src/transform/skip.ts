import { Transform } from "readable-stream";
import { TransformOptions, Callback } from "../types";

interface SkipOptions extends TransformOptions {
  skip: number;
}

class Skip extends Transform {
  private count: number;
  private skip: number;

  constructor(options: SkipOptions) {
    super({ objectMode: true });
    this.count = 0;
    this.skip = options.skip || 0;
  }

  _transform(chunk: any, _: string, cb: Callback) {
    if (this.count > this.skip) {
      this.push(chunk);
    }
    this.count += 1;
    cb();
  }
}

export default Skip;
