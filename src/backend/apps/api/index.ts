import { FS } from "../../_shared/fs/fs";
import { analyzeItems, getMaengel } from "./nrw/nrw";
import { API_NRW, MANDANT_ID } from "./nrw/nrw.config";

const rawItems = getMaengel(API_NRW, MANDANT_ID);
const items = analyzeItems(rawItems);
// optional: Zipcodes
// ]mmeln
const generated = new Date().toISOString();
const zipcodes: string[] = [];
const stats = {};

zipcodes.sort();
const properties = items.length > 0 ? Object.keys(items[0]) : [];
const openedItems = items.filter((item: any) => item.status !== "closed");
const count = items.length;
const countOpen = openedItems.length;
const finalData: any = { items, zipcodes, generated, stats, count, properties };

const TARGET = "src/_data/maengel.json";
FS.writeFile(TARGET, JSON.stringify(finalData, null, 2));

const finalData2: any = {
  items: openedItems,
  zipcodes,
  generated,
  stats,
  count: countOpen,
  properties,
};

const TARGET2 = "src/_data/maengel_open.json";
FS.writeFile(TARGET2, JSON.stringify(finalData2, null, 2));
