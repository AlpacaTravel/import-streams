import { TransformFunction, JsonApiFieldReference } from "../../../../types";
import resolveJsonApiObject, {
  ResolveJsonApiObjectOptions,
} from "../../../resolve-json-api-object";

export interface EntityReferenceOptions extends ResolveJsonApiObjectOptions {}

const entityReference: TransformFunction<
  Promise<string | JsonApiFieldReference | undefined>,
  EntityReferenceOptions
> = async (value: any, options: EntityReferenceOptions): Promise<any> => {
  return resolveJsonApiObject(value, options);
};

export default entityReference;
