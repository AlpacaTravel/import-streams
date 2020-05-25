import {
  ComposableDefinition,
  SupportedStream,
} from "@alpaca-travel/import-streams-compose";
import { Transform as ReadableStreamTransform } from "readable-stream";
import { Transform as NodeJSTransform } from "stream"; // Discussion here on required

export type TransformFunction<U, B extends TransformFunctionOptions> = (
  value: any,
  options: B
) => U;

export type TransformSupportingContext<
  T extends ReadableStreamTransform,
  U extends TransformOptions
> = new (options: U) => T;

export type Callback = (error?: Error, data?: any) => undefined;

export interface TransformFunctionOptions extends TransformOptions {}

export interface TransformOptions {
  context: ComposeContext;
  debug?: boolean;
}

export type ComposeFunction = (doc: ComposableDefinition) => SupportedStream;

export interface ComposeContext {
  compose: ComposeFunction;
}

export interface TransformFactory {
  type: string;
  options?: any;
}

export type TransformReference = string | TransformFactory;

export type Transform = TransformReference | Array<TransformReference>;

export interface TransformReferences {
  [any: string]:
    | TransformFunction<any, any>
    | TransformSupportingContext<any, any>;
}

export interface MediaSource {
  key: string;
  src: string;
  width: number;
  height: number;
  type: string;
}

export interface MediaUrl {
  prefix?: string;
  suffix?: string;
}

export interface MediaOriginal {
  width: number;
  height: number;
}

export interface Media {
  $schema: string;
  $ref?: string;
  provider?: string;
  type: string;
  original: MediaOriginal;
  sources: Array<MediaSource>;
  url?: MediaUrl;
}

export interface JsonApiLink {
  href: string;
}

export interface JsonApiFieldLinks {
  related: JsonApiLink;
}

export interface JsonApiFieldReference {
  links: JsonApiFieldLinks;
}

export interface JourneyUserJson {
  id: string;
}

export interface JourneyJsonJourneyRouteServiceQuery {
  mode?: string;
  point?: Array<string | Array<number>>;
}

export interface JourneyJsonJourneyMapFeature {}

export interface JourneyJsonJourneyRoute {
  id: string;
  start_journey_map_feature_id: string;
  end_journey_map_feature_id: string;
  travel_via: string;
  service_query: JourneyJsonJourneyRouteServiceQuery;
  duration?: number;
  duration_unit?: string;
  distance?: number;
  distance_unit?: string;
  order: number;
  halfway?: [number, number];
  bbox: [number, number, number, number];
}

export interface JourneyJson {
  id: string;
  title?: string;
  journey_stage?: string;
  user: JourneyUserJson;
  journey_route: JourneyJsonJourneyRoute[];
}

export interface JourneyJsonEnvelope {
  journey: JourneyJson;
}

export const isTransformFunction = (
  tbd: any
): tbd is TransformFunction<any, any> => {
  if (typeof tbd === "function" && !isTransformSupportingContext(tbd)) {
    return true;
  }
  return false;
};

export const isTransformSupportingContext = (
  tbd: any
): tbd is TransformSupportingContext<any, any> => {
  if (tbd == null) {
    return false;
  }
  if (
    tbd.prototype instanceof ReadableStreamTransform ||
    tbd.prototype instanceof NodeJSTransform ||
    // Possibly not required, instanceof may test recursively?
    isTransformFunction(tbd.prototype)
  ) {
    return true;
  }
  return false;
};
