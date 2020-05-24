import assert from "assert";
import { Writable } from "readable-stream";
import network from "../network";

interface SyncExternalItemsOptions {
  apiKey: string;
  collection: string;
  profile: string;
}

interface Attribute {
  $ref: string;
  title?: string;
}

interface AttributeDefinition {
  attribute: Attribute;
  value?: any;
  locale?: any;
}

interface Resource {
  $schema: string;
  $ref?: string;
  attributes?: Array<AttributeDefinition>;
  [key: string]: any;
}

interface Item {
  $schema: string;
  $ref?: string;
  resource?: Resource;
  attributes?: Array<AttributeDefinition>;
  [key: string]: any;
}

interface RecordSync {
  id?: string;
  externalRef?: string;
  externalSource?: string;
  created?: Date;
  modified?: Date;
}

type Callback = (error?: Error) => undefined;

export const createWriteStream = (options: SyncExternalItemsOptions) => {
  return new SyncExternalItems(options);
};

const cleanRef = (ref: string, type: string) => {
  const id = ref.replace("alpaca://", "").replace(`${type}/`, "");
  return `alpaca://${type}/${id}`;
};

class SyncExternalItems extends Writable {
  private apiKey: string;
  private collection: string;
  private profile: string;
  private cache: Promise<Array<RecordSync>> | undefined;
  private pushed: Array<RecordSync>;

  constructor(options: SyncExternalItemsOptions) {
    super({ objectMode: true });

    const { apiKey, collection, profile } = options;

    assert(
      apiKey && typeof apiKey === "string" && apiKey.substr(0, 2) === "sk",
      "Missing Secret API Key"
    );
    assert(
      collection && typeof collection === "string",
      "Collection reference is required"
    );
    assert(
      profile && typeof profile === "string",
      "Profile reference is required"
    );

    this.apiKey = apiKey;
    this.collection = cleanRef(collection, "collection");
    this.profile = cleanRef(profile, "profile");

    this.pushed = [];
  }

  _write(item: Item, _: string, callback: Callback) {
    // Perform teh sync
    (async () => {
      try {
        assert(
          typeof item.$schema === "string" && item.$schema.indexOf("item") > 0,
          "Received item should contain a valid $schema that matches an item type"
        );

        // TODO: Use ajv to validate against our item schemas

        // Obtain the identifiers from the record
        const {
          externalRef,
          externalSource,
          created,
          modified,
        } = fetchRecordSyncDetails(item);
        const timestamp = modified || created;
        if (!externalRef || !externalSource) {
          throw new Error(
            "Must configure the external-ref and external-source attribute values in order to push record to the collection"
          );
        }

        // Do we have this record at all?
        const list = await this.getRecordSyncs();
        const match = list.find(
          (recordSync) =>
            recordSync.externalRef === externalRef &&
            recordSync.externalSource === externalSource
        );
        if (match) {
          // If yes, we need to get the full record to be able to merge
          if (
            !timestamp ||
            (timestamp &&
              match.modified &&
              timestamp.getTime() > match.modified.getTime())
          ) {
            // We have detected a timestamp change OR no timestamp to compare, so just push
            const merged = this.getItemForTransport(
              await this.merge(match, item)
            );

            // Update the toggle flag
            const importPresentAttribute = (merged.attributes || []).find(
              (att) => att.attribute.$ref === "custom://import-present"
            );
            if (importPresentAttribute) {
              importPresentAttribute.value = true;
            } else {
              (merged.attributes || []).push({
                attribute: {
                  $ref: "custom://import-present",
                },
                value: true,
              });
            }

            const url = `https://withalpaca.com/api/v2/${merged.$id}/publish?accessToken=${this.apiKey}`;

            const httpOptions = {
              headers: {
                "Content-Type": "application/json",
              },
              method: "put",
              data: JSON.stringify(merged),
            };

            await network.write(url, httpOptions);
          } else {
            // We can ignore the record here.
          }
        } else {
          const merged: Item = JSON.parse(JSON.stringify(item));

          // Update the toggle flag
          const importPresentAttribute = (merged.attributes || []).find(
            (att) => att.attribute.$ref === "custom://import-present"
          );
          if (importPresentAttribute) {
            importPresentAttribute.value = true;
          } else {
            (merged.attributes || []).push({
              attribute: {
                $ref: "custom://import-present",
              },
              value: true,
            });
          }

          // If no, just push
          const url = `https://withalpaca.com/api/v2/item?accessToken=${this.apiKey}`;

          const httpOptions = {
            headers: {
              "Content-Type": "application/json",
            },
            method: "post",
            data: JSON.stringify(this.getItemForTransport(merged)),
          };

          await network.write(url, httpOptions);
        }

        callback();
      } catch (e) {
        callback(e);
      }
    })();
  }

  _final(callback: Callback) {
    (async () => {
      try {
        // Go through the cache
        const list = await this.getRecordSyncs();

        // For records where we have the external-ref/external-site, see if we have seen it
        const toRemove: Array<RecordSync> = list.reduce(
          (c: Array<RecordSync>, record: RecordSync) => {
            // If this isn't a sync record
            if (!record.externalRef || !record.externalSource) {
              return c;
            }

            const seen = this.pushed.find((r) => {
              return (
                r.externalRef === record.externalRef &&
                r.externalSource === record.externalSource
              );
            });
            if (!seen) {
              return c.concat([record]);
            }

            return c;
          },
          []
        );

        const removeTasks = toRemove.map(async (record) => {
          const mergeRecordFlag: Item = {
            $schema: "https://schemas.alpaca.travel/item-v1.0.0.schema.json",
            attributes: [
              {
                attribute: {
                  $ref: "custom://import-present",
                },
                value: false,
              },
            ],
          };

          // We have detected a timestamp change OR no timestamp to compare, so just push
          const merged = this.getItemForTransport(
            await this.merge(record, mergeRecordFlag)
          );

          const url = `https://withalpaca.com/api/v2/${merged.$id}/publish?accessToken=${this.apiKey}`;
          const httpOptions = {
            headers: {
              "Content-Type": "application/json",
            },
            method: "put",
            data: JSON.stringify(merged),
          };

          await network.write(url, httpOptions);
        });

        await Promise.all(removeTasks);

        callback();
      } catch (e) {
        callback(e);
      }
    })();
  }

  async getRecordSyncs(): Promise<Array<RecordSync>> {
    if (this.cache) {
      return this.cache;
    }

    this.cache = (async () => {
      const recordSyncs = [];
      let totalItems = 10; // Will update on first call

      // Call out for the elements
      const limit = 100;
      let offset = 0;
      let href = `https://withalpaca.com/api/v2/item?collection=${this.collection}&profile=${this.profile}&limit=${limit}&offset=${offset}&accessToken=${this.apiKey}`;
      const httpOptions = {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        method: "get",
      };
      while (true && recordSyncs.length < totalItems) {
        href = href.replace(/offset=[\d]+/, `offset=${offset}`);
        const data: any = await network.objectRead(href, httpOptions);
        // Exit
        if (
          !data ||
          !data.total ||
          !data.results ||
          data.results.length === 0
        ) {
          break;
        }

        // Keep track of the total items
        totalItems = data.total;

        // Build the local items for reference
        recordSyncs.push(
          ...data.results.map((item: Item) => {
            const returnRecord = fetchRecordSyncDetails(item);

            // id, created, updated, external-ref, external-source
            assert(
              item.$ref && typeof item.$ref === "string",
              "Missing item $ref in response"
            );
            returnRecord.id = (cleanRef(item.$ref, "item") || "").replace(
              "alpaca://",
              ""
            );

            return returnRecord;
          })
        );

        // Update the offset
        offset += limit;
      }

      return recordSyncs;
    })();

    return this.cache;
  }

  getItemForTransport(item: Item): Item {
    const dupe = JSON.parse(JSON.stringify(item));

    // Any final cleanup - this probably can be removed
    delete dupe.created;
    delete dupe.modified;
    delete dupe["geometry-features"];

    if (dupe.$ref) {
      dupe.$id = dupe.$ref.replace("alpaca://", "");
      delete dupe.$ref;
    }

    dupe.profile = {
      $ref: this.profile,
    };

    dupe.collection = {
      $ref: this.collection,
    };

    return dupe;
  }

  async merge(origin: RecordSync, next: Item): Promise<Item> {
    const { id } = origin;

    const url = `https://withalpaca.com/api/v2/${id}?accessToken=${this.apiKey}`;
    const httpOptions = {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      method: "get",
    };
    const data = await network.objectRead(url, httpOptions);
    if (!data) {
      throw new Error(`Record ${id} no longer exists`);
    }

    const replacement: Item = JSON.parse(JSON.stringify(data));

    // Replace the direct entries
    Object.keys(next)
      .filter((f) => f !== "attributes")
      .forEach((key) => {
        replacement[key] = next[key];
      });

    // Remove any matching values
    replacement.attributes = (replacement.attributes || []).filter((att) => {
      const match = (next.attributes || []).find(
        (rAtt) => rAtt.attribute.$ref === att.attribute.$ref
      );
      if (match) {
        return false;
      }
      return true;
    });

    // Reassign
    replacement.attributes = replacement.attributes.concat(
      next.attributes || []
    );

    return replacement;
  }
}

export default SyncExternalItems;

const fetchRecordSyncDetails = (record: Item): RecordSync => {
  const externalRef = (() => {
    const externalRefAttribute = (record.attributes || []).find(
      (att) => att.attribute.$ref === "custom://external-ref"
    );
    if (externalRefAttribute) {
      return externalRefAttribute.value;
    }
  })();
  const externalSource = (() => {
    const externalSourceAttribute = (record.attributes || []).find(
      (att) => att.attribute.$ref === "custom://external-source"
    );
    if (externalSourceAttribute) {
      return externalSourceAttribute.value;
    }
  })();

  return {
    externalRef,
    externalSource,
    created: new Date(record.created),
    modified: new Date(record.modified || record.created),
  };
};