import URI from "urijs";
import { TransformFunction, TransformOptions } from "../types";

export interface UriParseOptions extends TransformOptions {}

const uriParse: TransformFunction<Promise<any>, UriParseOptions> = async (
  value: any,
  options: UriParseOptions
): Promise<any | undefined> => {
  try {
    if (typeof value === "string") {
      const uri = new URI(value);
      const host = uri.host();
      const path = uri.path();
      const port = uri.port();
      const scheme = uri.scheme();
      const userinfo = uri.userinfo();
      const fragment = uri.fragment();
      const query = uri.query();

      return {
        scheme,
        userinfo,
        host,
        port,
        path,
        query,
        fragment,
      };
    }
  } catch (e) {
    // ...
  }

  return undefined;
};

export default uriParse;
