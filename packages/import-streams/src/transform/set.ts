import { TransformFunction, TransformOptions } from "../types";
import { set as _set, cloneDeep } from "lodash";
import { assertValidTransformOptions } from "../assertions";
import assert from "assert";

export interface SetOptions extends TransformOptions {
  path: string;
  value: any;
}

const set: TransformFunction<Promise<any>, SetOptions> = async (
  value: any,
  options: SetOptions
): Promise<any> => {
  assertValidTransformOptions(options, ["path", "value"], "set");
  const { path, value: replacementValue } = options;
  assert(path, "Missing a path");
  assert(replacementValue, "Missing a value");

  const clone = cloneDeep(value);
  _set(clone, path, replacementValue);

  return clone;
};

export default set;
