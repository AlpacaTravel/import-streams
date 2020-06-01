import * as URI from "uri-js";
import { TransformFunction, TransformOptions } from "../types";

export interface UriParseOptions extends TransformOptions {}

const uriParse: TransformFunction<Promise<any>, UriParseOptions> = async (
  value: any,
  options: UriParseOptions
): Promise<any | undefined> => {
  if (typeof value === "string") {
    return URI.parse(value);
  }

  return undefined;
};

export default uriParse;
