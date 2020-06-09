import { TransformFunction, TransformOptions } from "../types";

export interface ToNumberOptions extends TransformOptions {}

const toNumber: TransformFunction<
  Promise<number | undefined>,
  ToNumberOptions
> = async (
  value: any,
  options: ToNumberOptions
): Promise<number | undefined> => {
  if (typeof value !== "undefined" || value !== null) {
    const val = Number(value);
    if (val !== Number.NaN) {
      return val;
    }
  }

  return undefined;
};

export default toNumber;
