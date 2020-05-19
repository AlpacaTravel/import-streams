import { TransformFunctions } from "../../../types";
import boolean from "./boolean";
import email from "./email";
import addressField from "./address-field";
import geofield from "./geofield";
import link from "./link";
import telephone from "./telephone";
import textFormatted from "./text-formatted";
import textPlain from "./text-plain";
import jsonApi from "./json-api";

import { packageTransforms } from "../../../packaging";

const packages: TransformFunctions = {
  boolean,
  "address-field": addressField,
  email,
  geofield,
  link,
  telephone,
  "text-formatted": textFormatted,
  "text-plain": textPlain,
};

Object.assign(
  packages,

  // Package the json api
  packageTransforms(jsonApi, "json-api")
);

export default packages;
