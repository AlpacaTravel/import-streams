import { TransformFunction } from "../../../types";
import url, { ToUrlOptions } from "../../to-url";

export interface LinkOptions extends ToUrlOptions {}

const link: TransformFunction<
  Promise<string | undefined>,
  LinkOptions
> = async (value: any, options: LinkOptions): Promise<string | undefined> => {
  if (value && value.uri) {
    return url(value.uri, options);
  }

  return undefined;
};

export default link;
