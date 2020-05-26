import { TransformFunction, TransformOptions } from "../types";
import { assertValidTransformOptions } from "../assertions";

export interface JoinOptions extends TransformOptions {
  seperator?: string;
}

const join: TransformFunction<
  Promise<string | undefined>,
  JoinOptions
> = async (value: any, options: JoinOptions): Promise<string | undefined> => {
  assertValidTransformOptions(options, ["seperator"], "join");

  if (Array.isArray(value)) {
    return value.join(options.seperator);
  }

  return undefined;
};

export default join;
