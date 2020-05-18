import selector from "../../../src/transform/selector";
import transforms from "../../../src/transform/index";

describe("selectorTransforms", () => {
  test("will obtain a value from a selector", async () => {
    const options = {
      selector: "foo",
      context: {
        transforms,
      },
    };
    const value = {
      foo: "bar",
    };
    expect(await selector(value, options)).toBe("bar");
  });
  test("will obtain a value from a selector with short modifier", async () => {
    const value = {
      foo: "www.google.com",
    };
    const options = {
      selector: {
        selector: "foo",
        transform: "url",
      },
      context: {
        transforms,
      },
    };
    expect(await selector(value, options)).toBe("http://www.google.com");
  });
  test("will obtain a value from a selector with modifier with options", async () => {
    const value = {
      foo: true,
    };
    const config = {
      selector: {
        selector: "foo",
        transform: [{ type: "boolean", options: { inverse: true } }],
      },
      context: {
        transforms,
      },
    };
    expect(await selector(value, config)).toBe(false);
  });
  test("will obtain a value from a selector and process a mixed array of modifiers", async () => {
    const value = {
      foo: "www.google.com",
    };
    const options = {
      selector: {
        selector: "foo",
        transform: ["text", { type: "url" }],
      },
      context: {
        transforms,
      },
    };
    expect(await selector(value, options)).toBe("http://www.google.com");
  });
  test("will support multiple selectors for fallback", async () => {
    const value = {
      foo: "www.google.com",
    };
    const options = {
      selector: {
        selector: ["non-existant", "foo"],
        transform: ["text", { type: "url" }],
      },
      context: {
        transforms,
      },
    };
    expect(await selector(value, options)).toBe("http://www.google.com");
  });
});
