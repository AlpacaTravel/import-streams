import { TransformFunction, TransformOptions } from "../types";

export interface DateOptions extends TransformOptions {
  format?: string;
}

const date: TransformFunction<Promise<any>, DateOptions> = async (
  value: any,
  options: DateOptions
): Promise<number | string | undefined> => {
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

export default date;
