import { TransformReferences } from "../types";
import selector from "./selector";
import mapSelector from "./map-selector";
import url from "./url";
import uriParse from "./uri-parse";
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
import parse from "./json-parse";
import resolveFetchObject from "./resolve-fetch-object";
import base64Decode from "./base64-decode";
import each from "./each";
import join from "./join";
import jsonApi from "./json-api";
import drupal from "./drupal";
import skip from "./skip";
import resolveJourney from "./resolve-journey";
import fexp from "./fexp";
import FilterFexp from "./filter-fexp";
import htmlEntitiesDecode from "./html-entities-decode";
import sprintf from "./sprintf";
import resolveAwsS3GetObjectStream from "./resolve-aws-s3-get-object-stream";
import resolveAwsS3GetObject from "./resolve-aws-s3-get-object";

import { packageTransforms } from "../packaging";

const transforms: TransformReferences = {};

// Defaults
Object.assign(transforms, {
  concat,
  join,
  console,
  sprintf,
  "json-stringify": stringify,
  "json-parse": parse,
  "uri-parse": uriParse,
  selector,
  each,
  "map-selector": mapSelector,
  "base64-decode": base64Decode,
  url,
  boolean,
  fexp: fexp,
  "filter-fexp": FilterFexp,
  date,
  flatten,
  skip,
  "html-prettier": htmlPrettier,
  "html-sanitize": htmlSanitize,
  "html-entities-decode": htmlEntitiesDecode,
  ["resolve-fetch-object"]: resolveFetchObject,
  ["resolve-journey"]: resolveJourney,
  number,
  truncate,
  position,
  replace,
  text,
  ["resolve-aws-s3-get-object-stream"]: resolveAwsS3GetObjectStream,
  ["resolve-aws-s3-get-object"]: resolveAwsS3GetObject,
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
