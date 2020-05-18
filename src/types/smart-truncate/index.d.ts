declare module "smart-truncate" {
  interface SmartTruncateOptions {
    position?: number;
    mark?: any;
  }
  function smartTruncate(
    text: string,
    length: number,
    options: SmartTruncateOptions
  ): string;
  export = smartTruncate;
}
