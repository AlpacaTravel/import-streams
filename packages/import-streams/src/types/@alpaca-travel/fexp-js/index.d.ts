declare module "@alpaca-travel/fexp-js" {
  export type fn = (...args: any[]) => any;
  export function parse(fexp: any[], lib: any): fn;
  export function langs(...langs: any[]): any;
}
