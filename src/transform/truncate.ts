import { smartTruncate } from "smart-truncate";
import { TransformFunction, TransformOptions } from "../types";

export interface TruncateOptions extends TransformOptions {
  length: number;
  position?: number;
  mark?: any;
  break?: boolean;
}

const truncate: TransformFunction<Promise<any>, TruncateOptions> = async (
  value: any,
  options: TruncateOptions
): Promise<number | string | undefined> => {
  const { length, position, mark, break: breakText } = options;

  let treatedValue = value;
  if (typeof treatedValue === "string") {
    if (breakText && treatedValue.indexOf("\n") > -1) {
      treatedValue = treatedValue.substr(0, treatedValue.indexOf("\n"));
    }

    treatedValue = smartTruncate(treatedValue, length, { position, mark });

    return treatedValue.trim();
  }

  return undefined;
};

export default truncate;
