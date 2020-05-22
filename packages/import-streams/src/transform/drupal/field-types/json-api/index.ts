import { TransformReferences } from "../../../../types";
import entityReference from "./entity-reference";
import image from "./image";

const packages: TransformReferences = {
  image,
  "entity-reference": entityReference,
};

export default packages;
