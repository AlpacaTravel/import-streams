import * as _ from "lodash";

// ${path}
const sections = /(\${[^\}]+})/g;

// Supports reading off an object
// Such as "foo" to obtain "bar" from { foo: "bar" }
// And.. "foo${foo}" to obtain "foobar" from { foo: "bar" }
// And "." to obtain { foo: "bar" } from { foo: "bar" }
export default (str: string, target: any) => {
  // Ensure we have a string
  if (!str || typeof str !== "string") {
    return null;
  }

  // Select the value with a ".""
  if (str === ".") {
    return target;
  }

  // Evaluate whether it contains a format like "${path}something${path}"
  if (/\${.+}/.test(str)) {
    let str2 = str;
    let match: RegExpExecArray | null;
    while ((match = sections.exec(str)) !== null) {
      // Replace each occurence of ${path} with the return result of "get" path
      str2 = str2.replace(
        match[0],
        _.get(target, match[0].replace(/^\${/, "").replace(/}$/, ""))
      );
    }
    return str2;
  }

  // Process as a standard "get" path on the object
  return _.get(target, str);
};
