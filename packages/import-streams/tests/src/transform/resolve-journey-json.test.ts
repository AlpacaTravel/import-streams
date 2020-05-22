import nock from "nock";
import resolveJourney, {
  ResolveJourneyOptions,
} from "../../../src/transform/resolve-journey";
import { createCompose } from "../../../src/index";

const compose = createCompose();
const context = {
  compose,
};

describe("Ressolve HTTP Request", () => {
  test("on array data", async () => {
    nock("https://embed.alpacamaps.com:443", {
      encodedQueryParams: true,
    })
      .get("/api/v1/journeys/bf3a3614-4bac-11ea-96fe-067ec0c7e8f4.json")
      .query({ geo: "0" })
      .reply(
        200,
        {
          journey: {
            id: "bf3a3614-4bac-11ea-96fe-067ec0c7e8f4",
            title: "example",
            journey_stage: "I've done this trip",
            user: {
              id: "2c464854-780c-11e6-9bdf-02329dafcfcd",
            },
            journey_routes: [],
            journey_map_features: [],
            journey_points_of_interest: [],
          },
        },
        ["Content-Type", "application/json"]
      );

    const options: ResolveJourneyOptions = {
      context,
      iterate: false,
      mapping: {
        foo: "title",
      },
    };
    const result = await resolveJourney(
      "bf3a3614-4bac-11ea-96fe-067ec0c7e8f4",
      options
    );

    expect(!Array.isArray(result)).toBe(true);
    if (!Array.isArray(result) && result != null) {
      expect(result).toMatchObject({ foo: "example" });
    }
  });
});
