import { TransformFunction, TransformOptions } from "../types";
import { assertValidTransformOptions } from "../assertions";

export interface ReplaceOptions extends TransformOptions {
  value?: any;
  type?: "date" | "literal";
}

const replace: TransformFunction<Promise<any>, ReplaceOptions> = async (
  _: any,
  options: ReplaceOptions
): Promise<any> => {
  assertValidTransformOptions(options, ["value", "type"], "replace");
  const { value = undefined, type = "literal" } = options || {};

  // Add ability to substitute date value
  if (type === "date") {
    if (value === "now") {
      return Date.now();
    }
    return new Date(value);
  }

  return value;
};

export default replace;
