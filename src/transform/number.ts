import { TransformFunction, TransformOptions } from "../types";

export interface NumberOptions extends TransformOptions {}

const number: TransformFunction<
  Promise<number | undefined>,
  NumberOptions
> = async (value: any, options: NumberOptions): Promise<number | undefined> => {
  if (typeof value !== "undefined" || value !== null) {
    const val = Number(value);
    if (val !== Number.NaN) {
      return val;
    }
  }

  return undefined;
};

export default number;
