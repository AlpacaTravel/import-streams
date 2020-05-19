import { TransformFunction } from "../../../types";
import url, { UrlOptions } from "../../url";

export interface LinkOptions extends UrlOptions {}

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
