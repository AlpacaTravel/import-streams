import transforms from "../../../src/transform/index";

describe("transforms", () => {
  test("coverage of mapping/selector/basic use cases", async () => {
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
              selector: "bool1",
              transform: "boolean",
            },
            bool2: {
              selector: "bool2",
              transform: "boolean",
            },
            date: {
              selector: "date",
              transform: {
                type: "date",
                options: {
                  format: "timestamp",
                },
              },
            },
          },
          context: {
            transforms,
          },
        }
      )
    ).toMatchObject({
      bool1: true,
      bool2: false,
    });
  });
});
