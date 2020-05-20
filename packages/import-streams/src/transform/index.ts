import { TransformFunctions } from "../types";
// import transform from "./transform";
import selector from "./selector";
import mapSelector from "./map-selector";
import url from "./url";
import boolean from "./boolean";
import date from "./date";
import flatten from "./flatten";
import htmlPrettier from "./html-prettier";
import htmlSanitize from "./html-sanitize";
import number from "./number";
import position from "./position";
import replace from "./replace";
import text from "./text";
import truncate from "./truncate";

import jsonApi from "./json-api";
import drupal from "./drupal";

import { packageTransforms } from "../packaging";

const transforms: TransformFunctions = {};

// Defaults
Object.assign(transforms, {
  // transform,
  selector,
  "map-selector": mapSelector,
  url,
  boolean,
  date,
  flatten,
  "html-prettier": htmlPrettier,
  "html-sanitize": htmlSanitize,
  number,
  truncate,
  position,
  replace,
  text,
});

// Assign sub-collections
Object.assign(
  transforms,

  // JSON:API
  packageTransforms(jsonApi, "json-api"),

  // Drupal
  packageTransforms(drupal, "drupal")
);

export default transforms;
