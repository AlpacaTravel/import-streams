import striptags from "striptags";
import { TransformFunction, TransformOptions } from "../types";

export interface TextOptions extends TransformOptions {}

const text: TransformFunction<Promise<any>, TextOptions> = async (
  value: any,
  options: TextOptions
): Promise<string | undefined> => {
  if (typeof value === "string") {
    const newValue = striptags(value).trim();
    if (newValue.length) {
      return newValue;
    }
    return undefined;
  }

  return undefined;
};

export default text;
