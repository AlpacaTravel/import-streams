import { TransformFunction, TransformOptions } from "../types";
import { sprintf as sprintfImplementation } from "sprintf-js";
import { assertValidTransformOptions } from "../assertions";

export interface SprintfOptions extends TransformOptions {
  format: string;
}

const sprintf: TransformFunction<
  Promise<string | undefined>,
  SprintfOptions
> = async (
  value: any,
  options: SprintfOptions
): Promise<string | undefined> => {
  assertValidTransformOptions(options, ["format"], "sprintf");

  return sprintfImplementation(options.format, value);
};

export default sprintf;
