import { TransformFunction } from "./types";

interface PackagedTranforms {
  [key: string]: TransformFunction<any, any>;
}

export const packageTransforms = (
  suppliedPackage: PackagedTranforms,
  prefix?: string
): PackagedTranforms =>
  (() =>
    Object.keys(suppliedPackage).reduce(
      (c: PackagedTranforms, packageExport: string) =>
        Object.assign({}, c, {
          [prefix
            ? `${prefix}.${packageExport}`
            : packageExport]: suppliedPackage[packageExport],
        }),
      {}
    ))();
