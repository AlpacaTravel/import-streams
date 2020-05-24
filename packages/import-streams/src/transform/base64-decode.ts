import { TransformFunction, TransformOptions } from "../types";

export interface Base64DecodeOptions extends TransformOptions {}

const base64decode: TransformFunction<
  Promise<string | undefined>,
  Base64DecodeOptions
> = async (
  value: any,
  options: Base64DecodeOptions
): Promise<string | undefined> => {
  if (typeof value === "string") {
    const buff = new Buffer(value);
    return buff.toString("ascii");
  }

  return undefined;
};

export default base64decode;
