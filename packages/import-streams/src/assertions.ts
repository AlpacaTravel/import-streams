import assert from "assert";

function containsOnly(array1: any[], array2: any[]) {
  return array2.every((elem) => array1.includes(elem));
}

export function assertValidKeys(
  obj: any,
  validKeys: string[],
  message: string
) {
  if (typeof obj !== "object") {
    throw new Error("No keys on this type of definition");
  }

  const keys = Object.keys(obj);
  assert(containsOnly(validKeys, keys), message);
}
