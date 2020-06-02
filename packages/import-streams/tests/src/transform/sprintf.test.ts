import sprintf from "../../../src/transform/sprintf";
import { createCompose } from "../../../src/index";

const compose = createCompose();

describe("sprintf", () => {
  test("will obtain a value from an object", async () => {
    const options = {
      format: "hello %(name)s",
      context: {
        compose,
      },
    };
    const value = { name: "Cam" };
    expect(await sprintf(value, options)).toBe("hello Cam");
  });
});
