import { TransformFunctions } from "../../../../types";
import entityReference from "./entity-reference";
import image from "./image";

const packages: TransformFunctions = {
  image,
  "entity-reference": entityReference,
};

export default packages;
