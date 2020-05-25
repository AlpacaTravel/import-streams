import { Transform } from "readable-stream";
import { parse, langs } from "@alpaca-travel/fexp-js";
import libStd from "@alpaca-travel/fexp-js-lang";
import libGis from "@alpaca-travel/fexp-js-lang-gis";

import { TransformOptions, Callback } from "../types";
import assert from "assert";

interface FilterFexpOptions extends TransformOptions {
  expression: any;
}

type Fn = (...args: any[]) => any;

class FilterFexp extends Transform {
  private fn: Fn;

  constructor(options: FilterFexpOptions) {
    super({ objectMode: true });

    assert(options.expression, "Missing the fexp expression");

    this.fn = parse(options.expression, langs(libStd, libGis));
  }

  _transform(chunk: any, _: string, cb: Callback) {
    if (this.fn(chunk)) {
      this.push(chunk);
    }
    cb();
  }
}

export default FilterFexp;
