import { TransformFunction } from "../../../types";
import standardBoolean, { ToBooleanOptions } from "../../to-boolean";

const boolean: TransformFunction<
  Promise<boolean | undefined>,
  ToBooleanOptions
> = async (
  value: any,
  options: ToBooleanOptions
): Promise<boolean | undefined> => {
  return standardBoolean(value, options);
};

export default boolean;
