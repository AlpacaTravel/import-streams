import { TransformFunction, TransformOptions } from "../types";

export interface ReplaceOptions extends TransformOptions {
  value?: any;
}

const replace: TransformFunction<Promise<any>, ReplaceOptions> = async (
  _: any,
  options: ReplaceOptions
): Promise<any> => {
  const { value = undefined } = options || {};

  return value;
};

export default replace;
