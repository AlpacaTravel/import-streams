declare module "@alpaca-travel/fexp-js-lang" {
  type fn = (...args: any[]) => any;
  namespace ns {
    const lib: { [str: string]: fn };
  }
  export default ns.lib;
}
