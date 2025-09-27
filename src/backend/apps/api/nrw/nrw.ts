import { LOG } from '../../../_shared/log/log';
import {
    A11Y_WORDS,
    FORWAREDNOTES,
    SOLVEDNOTES,
    STATUS_TYPES,
} from './nrw.config';
const { execSync } = require('child_process');
import { MAENGEL } from './nrw.d';

LOG.OK('API');
const startYear = 2023;
// const startYear = 2025;
const startMonth = 1;
// const startMonth = 6;

const getEndDate = (year: number, month: number) => {
    // Monat 1–12
    const lastDay = new Date(year, month, 0).getDate();
    return `${year}-${String(month).padStart(2, '0')}-${lastDay}`;
};

export const getMaengel = (api: string, mandantID: string): MAENGEL[] => {
    const allItems: MAENGEL[] = [];
    for (let year = startYear; year <= new Date().getFullYear(); year++) {
        for (let month = startMonth; month <= 12; month++) {
            const start = `${year}-${String(month).padStart(2, '0')}-01`;
            const end = getEndDate(year, month);
            const url = `${api}/beteiligung/${mandantID}/requests.json?start_date=${start}&end_date=${end}`;

            try {
                const out = execSync(`curl -s "${url}"`).toString('utf-8');
                const items: MAENGEL[] = JSON.parse(out);
                const itemsClosed = items.filter(
                    (i: MAENGEL) => i.status === 'closed'
                );
                const itemsOpen = items.filter(
                    (i: MAENGEL) => i.status !== 'closed'
                );
                LOG.OK(
                    `GET ${start} ... ${items.length} Einträge (${itemsClosed.length} geschlossen, ${itemsOpen.length} offen)`
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

export const analyzeSolving = (item: MAENGEL) => {
    let tag = '';
    if (item.status === 'closed') {
        if (!item.status_notes || item.status_notes === null) {
            tag = 'no-solved-note';
        } else if (SOLVEDNOTES.indexOf(item.status_notes) !== -1) {
            tag = 'solved-note-known';
        } else if (FORWAREDNOTES.indexOf(item.status_notes) !== -1) {
            tag = 'forwarded-note-known';
        } else {
            tag = 'solved-note-unknown';
        }
    } else {
        const moreThenYearOld =
            new Date().getTime() - new Date(item.requested_datetime).getTime() >
            365 * 24 * 60 * 60 * 1000;
        if (moreThenYearOld) {
            tag = 'open-more-than-year';
        }
    }
    return `issue-${tag}`;
};
export const getA11yIssues = (item: MAENGEL) => {
    const status = item.status ? item.status.toLowerCase() : '';
    for (const type of STATUS_TYPES) {
        if (status.indexOf(type) !== -1) {
            return `type-${type}`;
        }
    }
    const description = item.description ? item.description.toLowerCase() : '';
    for (const word of A11Y_WORDS) {
        if (description.indexOf(word) !== -1) {
            return `a11y-word-${word}`;
        }
    }
    return false;
};

export const analyzeItems = (rawItems: MAENGEL[]) => {
    const zipcodes: string[] = [];
    const stats = {};
    const items: any[] = [];
    const unknownSolvedNotes: string[] = [];

    zipcodes.sort();
    for (const rawItem of rawItems) {
        const newItem: any = { ...rawItem, tags: [] };
        if (rawItem.zipcode && !zipcodes.includes(rawItem.zipcode)) {
            zipcodes.push(rawItem.zipcode);
        }
        const statusTag = analyzeSolving(rawItem);
        if (statusTag) {
            newItem.tags.push(statusTag);
            setStat(statusTag, stats);
            if (statusTag === 'solved-note-unknown' && rawItem.status_notes) {
                unknownSolvedNotes.push(rawItem.status_notes);
            }
        }

        const a11yTag = getA11yIssues(rawItem);
        if (a11yTag) {
            newItem.tags.push(a11yTag);

            setStat(a11yTag, stats);
        }
        const startDate = rawItem.requested_datetime;
        const lastDate = rawItem.updated_datetime;
        let daysSolving = 0;
        if (rawItem.status === 'closed') {
            daysSolving = Math.floor(
                (new Date(lastDate).getTime() - new Date(startDate).getTime()) /
                    (24 * 60 * 60 * 1000)
            );
            newItem.daysSolving = daysSolving;
        } else {
            daysSolving = Math.floor(
                (new Date().getTime() - new Date(startDate).getTime()) /
                    (24 * 60 * 60 * 1000)
            );
            newItem.daysSolving = daysSolving;
        }
        items.push(newItem);
    }
    return items;
};
