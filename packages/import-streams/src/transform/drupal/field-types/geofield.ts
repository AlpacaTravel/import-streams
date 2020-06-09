import { TransformFunction, TransformOptions } from "../../../types";
import toCoordinate from "../../to-coordinate";

export interface GeofieldOptions extends TransformOptions {}

const geofield: TransformFunction<
  Promise<Array<number> | undefined>,
  GeofieldOptions
> = async (
  value: any,
  options: GeofieldOptions
): Promise<Array<number> | undefined> => {
  return toCoordinate(value, options);
};

export default geofield;
