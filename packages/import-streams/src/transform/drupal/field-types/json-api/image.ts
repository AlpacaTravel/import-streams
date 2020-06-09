import { TransformFunction, TransformOptions, Media } from "../../../../types";
import resolveJsonApiObject, {
  ResolveJsonApiObjectOptions,
} from "../../../resolve-json-api-object";

export interface ImageStyle {
  width: number;
  height: number;
  key: string;
}

export interface ImageOptions extends TransformOptions {
  prefix: string;
  styles: Array<ImageStyle>;
  stylesPrefix: string;
}

const image: TransformFunction<
  Promise<Media | undefined>,
  ImageOptions
> = async (value: any, options: ImageOptions): Promise<Media | undefined> => {
  // Validate we have an image present
  if (!value || !value.data || !value.data.meta) {
    return undefined;
  }

  const { prefix } = options;
  if (!prefix) {
    throw new Error("Missing the image storage prefix");
  }

  // Setup the media
  const media: Media = {
    $schema: "https://schemas.alpaca.dev/media-v1.0.0.schema.json",
    provider: "Drupal",
    type: "image",
    sources: [],
    original: { width: 0, height: 0 },
  };

  // Extract out the meta about the file
  const { meta = {} } = value.data;
  const { width, height } = meta;
  media.original = {
    width,
    height,
  };
  media.url = {
    prefix,
  };

  // Resolve the element
  const resolveOptions: ResolveJsonApiObjectOptions = {
    context: options.context,
    iterate: false,
  };

  // Obtain the file reference
  const file = await resolveJsonApiObject(value, resolveOptions);

  // Prepare the original file information
  const { attributes = {} } = file;
  const { uri, filemime } = attributes;
  if (!uri || !uri.value || !uri.url) {
    return undefined;
  }
  const { value: drupalValue, url } = uri;

  // Create the original
  media.sources.push({
    key: "original",
    src: url,
    type: filemime,
    width,
    height,
  });

  options.styles.forEach((style) => {
    const stylesPrefix =
      (options && options.stylesPrefix) || "/sites/default/files/styles";
    if (
      style.width <= media.original.width &&
      style.height <= media.original.height
    ) {
      media.sources.push({
        key: style.key,
        width: style.width,
        height: style.height,
        type: filemime,
        src: `${stylesPrefix}${style.key}${drupalValue.replace(
          "public://",
          "/public/"
        )}`,
      });
    }
  });

  if (media.sources.length) {
    return media;
  }

  return undefined;
};

export default image;
