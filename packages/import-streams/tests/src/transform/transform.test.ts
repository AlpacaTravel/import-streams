import { createCompose } from "../../../src/index";
import {
  isTransformFunction,
  isTransformSupportingContext,
} from "../../../src/types";
import transforms from "../../../src/transform/index";

const compose = createCompose();

describe("transforms", () => {
  test("coverage of mapping/selector/basic use cases", async () => {
    expect(isTransformFunction(transforms["map-selector"])).toBe(true);
    if (isTransformFunction(transforms["map-selector"])) {
      expect(
        await transforms["map-selector"](
          {
            bool1: 1,
            bool2: "false",
            date: "2020-05-17 09:00:00",
            flatten: ["value"],
          },
          {
            mapping: {
              bool1: {
                path: "bool1",
                transform: "to-boolean",
              },
              bool2: {
                path: "bool2",
                transform: "to-boolean",
              },
              date: {
                path: "date",
                transform: {
                  type: "to-date-format",
                  options: {
                    format: "timestamp",
                  },
                },
              },
            },
            context: {
              compose,
            },
          }
        )
      ).toMatchObject({
        bool1: true,
        bool2: false,
      });
    }
  });
});
