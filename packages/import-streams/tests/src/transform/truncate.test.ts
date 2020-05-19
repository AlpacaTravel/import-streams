import truncate from "../../../src/transform/truncate";
import transforms from "../../../src/transform/index";

describe("truncate", () => {
  test("will obtain a value from a string", async () => {
    const options = {
      length: 5,
      context: {
        transforms,
      },
    };
    const value = "A really long string";
    expect(await truncate(value, options)).toBe("A re…");
  });
});
