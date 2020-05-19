import { TransformFunction, JsonApiFieldReference } from "../../../../types";
import resolveMapSelector, {
  ResolveMapSelectorOptions,
} from "../../../json-api/resolve-map-selector";

export interface EntityReferenceOptions extends ResolveMapSelectorOptions {}

const entityReference: TransformFunction<
  Promise<string | JsonApiFieldReference | undefined>,
  EntityReferenceOptions
> = async (value: any, options: EntityReferenceOptions): Promise<any> => {
  return resolveMapSelector(value, options);
};

export default entityReference;
