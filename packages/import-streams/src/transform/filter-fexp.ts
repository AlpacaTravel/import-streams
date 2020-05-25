import { Transform } from "readable-stream";
import { parse, langs } from "@alpaca-travel/fexp-js";
import libStd from "@alpaca-travel/fexp-js-lang";
import libGis from "@alpaca-travel/fexp-js-lang-gis";

import { TransformOptions, Callback } from "../types";
import assert from "assert";
import { assertValidTransformOptions } from "../assertions";

interface FilterFexpOptions extends TransformOptions {
  expression: any;
}

type Fn = (...args: any[]) => any;

class FilterFexp extends Transform {
  private fn: Fn;
  private expression: any;
  private useDebug: boolean;

  constructor(options: FilterFexpOptions) {
    super({ objectMode: true });

    assert(options.expression, "Missing the fexp expression");

    assertValidTransformOptions(options, ["expression"], "filter-fexp");

    this.expression = options.expression;
    this.fn = parse(options.expression, langs(libStd, libGis));

    this.useDebug = options.debug === true;
  }

  _transform(chunk: any, _: string, cb: Callback) {
    try {
      const result = this.fn(chunk);
      if (result === true) {
        this.push(chunk);
      }
      if (this.useDebug === true) {
        console.log("FilterFexp:", this.expression, chunk, result);
      }
    } catch (e) {
      if (this.useDebug === true) {
        console.error("FilterFexp", e);
      }
      cb(e);
    }
    cb();
  }
}

export default FilterFexp;
