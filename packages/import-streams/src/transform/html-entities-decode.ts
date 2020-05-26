import { AllHtmlEntities } from "html-entities";
import { TransformFunction, TransformOptions } from "../types";

export interface HtmlEntitiesDecodeOptions extends TransformOptions {}

const entities = new AllHtmlEntities();

const htmlEntitiesDecode: TransformFunction<
  Promise<any>,
  HtmlEntitiesDecodeOptions
> = async (
  value: any,
  options: HtmlEntitiesDecodeOptions
): Promise<string | undefined> => {
  if (typeof value === "string") {
    return entities.decode(value);
  }

  return undefined;
};

export default htmlEntitiesDecode;
