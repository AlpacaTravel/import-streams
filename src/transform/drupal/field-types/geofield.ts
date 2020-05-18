import { TransformFunction, TransformOptions } from "../../../types";
import position from "../../position";

export interface GeofieldOptions extends TransformOptions {}

const geofield: TransformFunction<
  Promise<Array<number> | undefined>,
  GeofieldOptions
> = async (
  value: any,
  options: GeofieldOptions
): Promise<Array<number> | undefined> => {
  return position(value, options);
};

export default geofield;
