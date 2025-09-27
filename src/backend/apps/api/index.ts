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
const finalData: any = { items, zipcodes, generated, stats };

const TARGET = "src/_data/maengel.json";
FS.writeFile(TARGET, JSON.stringify(finalData, null, 2));
