import { LOG } from "../../../_shared/log/log";
import { FORWAREDNOTES, SOLVEDNOTES } from "./nrw.config";
const { execSync } = require("child_process");
import { MAENGEL } from "./nrw.d";

LOG.OK("API");

const getEndDate = (year: number, month: number) => {
    // Monat 1–12
    const lastDay = new Date(year, month, 0).getDate();
    return `${year}-${String(month).padStart(2, "0")}-${lastDay}`;
};

export const getMaengel = (api: string, mandantID: string): MAENGEL[] => {
    const allItems: MAENGEL[] = [];
    for (let year = 2023; year <= new Date().getFullYear(); year++) {
        for (let month = 1; month <= 12; month++) {
            const start = `${year}-${String(month).padStart(2, "0")}-01`;
            const end = getEndDate(year, month);
            const url = `${api}/beteiligung/${mandantID}/requests.json?start_date=${start}&end_date=${end}`;

            try {
                const out = execSync(`curl -s "${url}"`).toString("utf-8");
                const items: MAENGEL[] = JSON.parse(out);
                const itemsClosed = items.filter(
                    (i: MAENGEL) => i.status === "closed",
                );
                const itemsOpen = items.filter(
                    (i: MAENGEL) => i.status !== "closed",
                );
                LOG.OK(
                    `GET ${start} ... ${items.length} Einträge (${itemsClosed.length} geschlossen, ${itemsOpen.length} offen)`,
                );
                allItems.push(...items);
            } catch (err: any) {
                LOG.FAIL(`Fehler bei ${start} → ${end}`, err?.message);
                continue;
            }
        }
    }

    LOG.OK(`ALL: ${allItems.length} Items`);

    return allItems;
};
export const setStat = (key: string, stats: any) => {
    if (!stats[key]) {
        stats[key] = 0;
    }
    stats[key]++;
};
export const analyzeItems = (rawItems: MAENGEL[]) => {
    const zipcodes: string[] = [];
    const stats = {};
    const items: any[] = [];
    const unknownSolvedNotes: string[] = [];

    zipcodes.sort();
    for (const item of rawItems) {
        const newItem: any = { ...item, tags: [] };
        if (item.zipcode && !zipcodes.includes(item.zipcode)) {
            zipcodes.push(item.zipcode);
        }

        if (item.status === "closed") {
            if (!item.status_notes || item.status_notes === null) {
                newItem.tags.push("no-solved-note");
                setStat("no-solved-note", stats);
            } else if (SOLVEDNOTES.indexOf(item.status_notes) !== -1) {
                newItem.tags.push("solved-note-known");
                setStat("solved-note-known", stats);
            } else if (FORWAREDNOTES.indexOf(item.status_notes) !== -1) {
                newItem.tags.push("forwarded-note-known");
                setStat("forwarded-note-known", stats);
            } else {
                newItem.tags.push("solved-note-unknown");
                setStat("solved-note-unknown", stats);
                unknownSolvedNotes.push(item.status_notes);
            }
        } else {
            const moreThenYearOld =
                new Date().getTime() -
                    new Date(item.requested_datetime).getTime() >
                365 * 24 * 60 * 60 * 1000;
            if (moreThenYearOld) {
                newItem.tags.push("open-more-than-year");
                setStat("open-more-than-year", stats);
            }
        }
        items.push(newItem);
    }
    // console.log(unknownSolvedNotes);
    return items;
};
