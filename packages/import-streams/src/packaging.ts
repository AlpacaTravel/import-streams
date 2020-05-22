import { TransformFunction, TransformReferences } from "./types";

export const packageTransforms = (
  suppliedPackage: TransformReferences,
  prefix?: string
): TransformReferences =>
  (() =>
    Object.keys(suppliedPackage).reduce(
      (c: TransformReferences, packageExport: string) =>
        Object.assign({}, c, {
          [prefix
            ? `${prefix}.${packageExport}`
            : packageExport]: suppliedPackage[packageExport],
        }),
      {}
    ))();
