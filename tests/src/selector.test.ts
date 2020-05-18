import selector from "../../src/selector";

describe("Selector statements", () => {
  test("Simple selections", () => {
    expect(selector(".", { foo: "bar" })).toMatchObject({ foo: "bar" });
    expect(selector("foo", { foo: "bar" })).toBe("bar");
    expect(selector("foo.bar", { foo: { bar: "foobar" } })).toBe("foobar");
  });

  test("Nested selectors", () => {
    expect(selector("${foo}bar", { foo: "foo" })).toBe("foobar");
    expect(
      selector("${foo.bar}${foo.foo}", { foo: { bar: "foobar", foo: "foo" } })
    ).toBe("foobarfoo");
  });
});
