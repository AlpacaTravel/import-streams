import { TransformFunction, TransformOptions } from "../types";

export interface StringUppercaseOptions extends TransformOptions {}

const stringUppercase: TransformFunction<
  Promise<any>,
  StringUppercaseOptions
> = async (
  value: any,
  options: StringUppercaseOptions
): Promise<string | undefined> => {
  if (typeof value === "string") {
    return value.toLocaleUpperCase();
  }

  return undefined;
};

export default stringUppercase;
