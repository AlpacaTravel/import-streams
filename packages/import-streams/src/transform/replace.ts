import { TransformFunction, TransformOptions } from "../types";
import { assertValidTransformOptions } from "../assertions";

export interface ReplaceOptions extends TransformOptions {
  value?: any;
}

const replace: TransformFunction<Promise<any>, ReplaceOptions> = async (
  _: any,
  options: ReplaceOptions
): Promise<any> => {
  assertValidTransformOptions(options, ["value"], "replace");
  const { value = undefined } = options || {};

  return value;
};

export default replace;
