import { TransformFunction, TransformOptions } from "../types";

export interface Base64DecodeOptions extends TransformOptions {
  encoding?:
    | "ascii"
    | "utf8"
    | "utf-8"
    | "utf16le"
    | "ucs2"
    | "ucs-2"
    | "base64"
    | "latin1"
    | "binary"
    | "hex";
}

const base64decode: TransformFunction<
  Promise<string | undefined>,
  Base64DecodeOptions
> = async (
  value: any,
  options: Base64DecodeOptions
): Promise<string | undefined> => {
  if (typeof value === "string") {
    const buff = new Buffer(value);
    return buff.toString((options && options.encoding) || "utf-8");
  }
  if (value instanceof Buffer) {
    return value.toString((options && options.encoding) || "utf-8");
  }

  return undefined;
};

export default base64decode;
