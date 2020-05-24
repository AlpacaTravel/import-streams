import { TransformReferences } from "../types";
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
import concat from "./concat";
import console from "./console";
import stringify from "./json-stringify";
import resolveFetchObject from "./resolve-fetch-object";
import base64Decode from "./base64-decode";

import jsonApi from "./json-api";
import drupal from "./drupal";

import { packageTransforms } from "../packaging";
import resolveJourney from "./resolve-journey";

const transforms: TransformReferences = {};

// Defaults
Object.assign(transforms, {
  concat,
  console,
  "json-stringify": stringify,
  selector,
  "map-selector": mapSelector,
  "base64-decode": base64Decode,
  url,
  boolean,
  date,
  flatten,
  "html-prettier": htmlPrettier,
  "html-sanitize": htmlSanitize,
  ["resolve-fetch-object"]: resolveFetchObject,
  ["resolve-journey"]: resolveJourney,
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
