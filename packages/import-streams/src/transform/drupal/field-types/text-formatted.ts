import { TransformFunction, TransformOptions } from "../../../types";

export interface TextFormattedOptions extends TransformOptions {}

const telephone: TransformFunction<
  Promise<string | undefined>,
  TextFormattedOptions
> = async (
  value: any,
  options: TextFormattedOptions
): Promise<string | undefined> => {
  if (value && value.processed) {
    return value.processed;
  }

  return undefined;
};

export default telephone;
