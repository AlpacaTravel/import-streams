import { TransformFunction, TransformOptions } from "../types";
import { assertValidTransformOptions } from "../assertions";

export interface PositionOptions extends TransformOptions {
  flip?: boolean;
  delimiter?: string;
}

const position: TransformFunction<
  Promise<Array<number> | undefined>,
  PositionOptions
> = async (
  value: any,
  options: PositionOptions
): Promise<Array<number> | undefined> => {
  assertValidTransformOptions(options, ["flip", "delimiter"], "position");

  // Support a split (long,lat)
  if (typeof value === "string") {
    const [_1, _2] = value.split((options && options.delimiter) || ",");

    // If the string is (lat, long), flip
    if (options && typeof options.flip === "boolean" && options.flip) {
      return [Number(_2), Number(_1)];
    }

    return [Number(_1), Number(_2)];
  }

  // Support an object
  if (typeof value === "object" && value) {
    const { lon, lat, latitude, longitude, lng } = value;

    return [Number(lon || longitude || lng), Number(lat || latitude)];
  }

  return undefined;
};

export default position;
