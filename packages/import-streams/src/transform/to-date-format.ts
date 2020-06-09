import { TransformFunction, TransformOptions } from "../types";
import { assertValidTransformOptions } from "../assertions";

export interface ToDateFormatOptions extends TransformOptions {
  format?: string;
}

const toDateFormat: TransformFunction<
  Promise<any>,
  ToDateFormatOptions
> = async (
  value: any,
  options: ToDateFormatOptions
): Promise<number | string | undefined> => {
  assertValidTransformOptions(options, ["format"], "date");

  if (value) {
    const { format } = options || {};
    const date = new Date(value);
    switch (format) {
      case "timestamp": {
        return date.getTime();
      }
      default: {
        return date.toISOString();
      }
    }
  }

  return undefined;
};

export default toDateFormat;
