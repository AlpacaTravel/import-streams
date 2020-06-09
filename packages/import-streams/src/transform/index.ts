import { TransformReferences } from "../types";
import selector from "./selector";
import mapSelector from "./map-selector";
import toUrl from "./to-url";
import uriParse from "./uri-parse";
import toBoolean from "./to-boolean";
import toDateFormat from "./to-date-format";
import flatten from "./flatten";
import htmlPrettier from "./html-prettier";
import htmlSanitize from "./html-sanitize";
import toNumber from "./to-number";
import toCoordinate from "./to-coordinate";
import replace from "./replace";
import htmlText from "./html-text";
import truncate from "./truncate";
import concat from "./concat";
import console from "./console";
import stringify from "./json-stringify";
import parse from "./json-parse";
import resolveFetchObject from "./resolve-fetch-object";
import resolveJsonApiObject from "./resolve-json-api-object";
import base64Decode from "./base64-decode";
import base64Encode from "./base64-encode";
import each from "./each";
import join from "./join";
import drupal from "./drupal";
import skip from "./skip";
import resolveJourney from "./resolve-alpaca-journey";
import fexp from "./fexp";
import FilterFexp from "./filter-fexp";
import htmlEntitiesDecode from "./html-entities-decode";
import sprintf from "./sprintf";
import resolveAwsS3GetObjectStream from "./resolve-aws-s3-get-object-stream";
import resolveAwsS3GetObject from "./resolve-aws-s3-get-object";
import stringLowercase from "./string-lowercase";
import stringUppercase from "./string-uppercase";

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
  "base64-encode": base64Encode,
  "to-url": toUrl,
  "to-boolean": toBoolean,
  "to-date-format": toDateFormat,
  fexp: fexp,
  "filter-fexp": FilterFexp,
  flatten,
  skip,
  "html-prettier": htmlPrettier,
  "html-sanitize": htmlSanitize,
  "html-entities-decode": htmlEntitiesDecode,
  "resolve-fetch-object": resolveFetchObject,
  "resolve-journey": resolveJourney,
  "resolve-alpaca-journey": resolveJourney,
  "resolve-json-api-object": resolveJsonApiObject,
  "to-number": toNumber,
  truncate,
  "to-coordinate": toCoordinate,
  replace,
  "html-text": htmlText,
  "resolve-aws-s3-get-object-stream": resolveAwsS3GetObjectStream,
  "resolve-aws-s3-get-object": resolveAwsS3GetObject,
  "string-lowercase": stringLowercase,
  "string-uppercase": stringUppercase,
});

// Assign sub-collections
Object.assign(
  transforms,

  // Drupal
  packageTransforms(drupal, "drupal")
);

export default transforms;
