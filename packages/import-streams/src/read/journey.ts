import assert from "assert";
import { Readable } from "readable-stream";
import network from "../network";
import { JourneyJsonEnvelope } from "../types";

interface JourneyOptions {
  includeRouteGeometry?: boolean;
  limit?: number;
}

export default class Journey extends Readable {
  private journeyIds: string[];
  private includeRouteGeometry: boolean;
  private generator: any;
  private limit: number;
  private count: number;

  constructor(journeyIds: string | string[], options?: JourneyOptions) {
    super({ objectMode: true });

    const processedJourneyIds = Array.isArray(journeyIds)
      ? journeyIds
      : [journeyIds];
    assert(
      processedJourneyIds.every((id) => typeof id === "string"),
      "Supplied Journey IDs should be strings"
    );

    this.journeyIds = processedJourneyIds;
    this.includeRouteGeometry =
      options != null && options.includeRouteGeometry === true;

    const { limit = 0 } = options || {};
    this.limit = limit;
    this.count = 0;
  }

  async *getRecordsGenerator() {
    // Build out URL's to source records
    const urls = this.journeyIds.map(
      (journeyId) =>
        `https://embed.alpacamaps.com/api/v1/journeys/${journeyId}.json?geo=${
          this.includeRouteGeometry === true ? "1" : "0"
        }`
    );

    // Source the records
    let current;
    while ((current = urls.pop())) {
      const query: JourneyJsonEnvelope = await network.objectRead(current, {
        method: "get",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      });

      const { journey } = query;
      yield journey;
    }
  }

  _read() {
    const generator = (() => {
      if (!this.generator) {
        this.generator = this.getRecordsGenerator();
      }

      return this.generator;
    })();

    (async () => {
      try {
        const { value, done } = await generator.next();
        if (value) {
          this.push(value);
          this.count += 1;
        }
        if (done || (this.limit && this.count >= this.limit)) {
          this.push(null);
        }
      } catch (e) {
        console.error(e.message);
        this.destroy(e);
      }
    })();
  }
}

export const createReadStream = (
  journeyIds: string | string[],
  options?: JourneyOptions
) => {
  const api = new Journey(journeyIds, options);

  return api;
};
