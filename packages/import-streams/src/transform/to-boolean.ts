import { TransformFunction, TransformOptions } from "../types";
import { assertValidTransformOptions } from "../assertions";

export interface ToBooleanOptions extends TransformOptions {
  inverse?: boolean;
  default?: boolean;
}

const toBoolean: TransformFunction<
  Promise<boolean | undefined>,
  ToBooleanOptions
> = async (
  value: any,
  options: ToBooleanOptions
): Promise<boolean | undefined> => {
  assertValidTransformOptions(options, ["inverse", "default"], "boolean");

  const returnValue = (() => {
    if (typeof value === "string") {
      switch (value.toLocaleLowerCase()) {
        case "1":
        case "yes":
        case "true":
          return true;
        case "0":
        case "no":
        case "false":
          return false;
        default:
          break;
      }
    }

    if (typeof value === "number") {
      if (value === 1) {
        return true;
      }
      if (value === 0) {
        return false;
      }
    }

    if (typeof value === "boolean") {
      return value;
    }
  })();

  if (typeof returnValue === "boolean") {
    if (options && options.inverse === true) {
      return !returnValue;
    }
    return returnValue;
  }

  if (typeof options.default !== "undefined") {
    return options.default;
  }

  return undefined;
};

export default toBoolean;
