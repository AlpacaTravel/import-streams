import { TransformFunction, TransformOptions } from "../types";

export interface Base64DecodeOptions extends TransformOptions {}

const base64encode: TransformFunction<
  Promise<string | undefined>,
  Base64DecodeOptions
> = async (
  value: any,
  options: Base64DecodeOptions
): Promise<string | undefined> => {
  if (typeof value === "string") {
    const buff = new Buffer(value);
    return buff.toString("base64");
  }
  if (value instanceof Buffer) {
    return value.toString("base64");
  }

  return undefined;
};

export default base64encode;
