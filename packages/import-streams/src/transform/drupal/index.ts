import { TransformFunctions } from "../../types";
import fieldTypes from "./field-types";

import { packageTransforms } from "../../packaging";

const packages: TransformFunctions = {};

Object.assign(packages, packageTransforms(fieldTypes, "field-types"));

export default packages;
