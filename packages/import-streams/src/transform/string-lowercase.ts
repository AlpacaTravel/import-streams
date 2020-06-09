import { TransformFunction, TransformOptions } from "../types";

export interface StringLowercaseOptions extends TransformOptions {}

const stringLowercase: TransformFunction<
  Promise<any>,
  StringLowercaseOptions
> = async (
  value: any,
  options: StringLowercaseOptions
): Promise<string | undefined> => {
  if (typeof value === "string") {
    return value.toLocaleLowerCase();
  }

  return undefined;
};

export default stringLowercase;
