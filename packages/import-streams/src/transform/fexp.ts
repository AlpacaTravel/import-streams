import { parse, langs } from "@alpaca-travel/fexp-js";
import libStandard from "@alpaca-travel/fexp-js-lang";
import libGis from "@alpaca-travel/fexp-js-lang-gis";

import { TransformFunction, TransformOptions } from "../types";
import assert from "assert";

const lang = langs(libStandard, libGis);

export interface FexpOptions extends TransformOptions {
  expression: any;
}

const fexp: TransformFunction<Promise<any>, FexpOptions> = async (
  value: any,
  options: FexpOptions
): Promise<any> => {
  assert(
    typeof options.expression !== "undefined",
    "Missing the expression for the fexp transform"
  );

  const fn = parse(options.expression, lang);

  return fn(value);
};

export default fexp;
