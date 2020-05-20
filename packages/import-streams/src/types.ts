import {
  ComposableDefinition,
  SupportedStream,
} from "@alpaca-travel/import-streams-compose";

export type TransformFunction<U, B extends TransformFunctionOptions> = (
  value: any,
  options: B
) => U;

export interface TransformFunctionOptions {
  context: ComposeContext;
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

export interface TransformOptions {
  context: ComposeContext;
}

export interface TransformFunctions {
  [any: string]: TransformFunction<any, any>;
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
