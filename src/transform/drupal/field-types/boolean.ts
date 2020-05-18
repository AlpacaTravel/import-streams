import { TransformFunction } from "../../../types";
import standardBoolean, { BooleanOptions } from "../../boolean";

const boolean: TransformFunction<
  Promise<boolean | undefined>,
  BooleanOptions
> = async (
  value: any,
  options: BooleanOptions
): Promise<boolean | undefined> => {
  return standardBoolean(value, options);
};

export default boolean;
