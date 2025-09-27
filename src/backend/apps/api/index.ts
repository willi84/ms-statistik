import { FS } from '../../_shared/fs/fs';
import { analyzeItems, getMaengel } from './nrw/nrw';
import { API_NRW, MANDANT_ID } from './nrw/nrw.config';

const rawItems = getMaengel(API_NRW, MANDANT_ID);
const items = analyzeItems(rawItems);
// optional: Zipcodes
// ]mmeln
const generated = new Date().toISOString();
const zipcodes: string[] = [];
const stats: any = {
    solvingPerService: {},
    solvingPerZIP: {},
};

zipcodes.sort();
const properties = items.length > 0 ? Object.keys(items[0]) : [];
const openedItems = items.filter((item: any) => item.status !== 'closed');
const count = items.length;
const countOpen = openedItems.length;
const tmpStats: any = {
    solvingPerService: {},
    solvingPerZIP: {},
};
const services = [];
for (const item of items) {
    if (!tmpStats.solvingPerService[item.service_name]) {
        tmpStats.solvingPerService[item.service_name] = {
            days: [],
            unsolved: 0,
            solved: 0,
        };
        services.push(item.service_name);
    }
    if (!tmpStats.solvingPerZIP[item.zipcode]) {
        tmpStats.solvingPerZIP[item.zipcode] = {
            days: [],
            unsolved: 0,
            solved: 0,
        };
    }
    if (item.status !== 'closed') {
        tmpStats.solvingPerService[item.service_name].unsolved++;
        tmpStats.solvingPerZIP[item.zipcode].unsolved++;
        tmpStats.solvingPerService[item.service_name].days.push(
            item.daysSolving
        );
        // console.log(item.daysSolving);
        tmpStats.solvingPerZIP[item.zipcode].days.push(item.daysSolving);
    } else {
        tmpStats.solvingPerService[item.service_name].solved++;
        tmpStats.solvingPerZIP[item.zipcode].solved++;
    }
}
for (const service of services) {
    const entry = tmpStats.solvingPerService[service];
    const sum = entry.days.reduce((a: number, b: number) => a + b, 0);
    const avg = entry.days.length > 0 ? sum / entry.days.length : 0;
    stats.solvingPerService[service] = {
        avgDays: Math.round(avg * 10) / 10,
        unsolved: entry.unsolved,
        solved: entry.solved,
    };
}
for (const zip of zipcodes) {
    const entry = tmpStats.solvingPerZip[zip];
    const sum = entry.days.reduce((a: number, b: number) => a + b, 0);
    const avg = entry.days.length > 0 ? sum / entry.days.length : 0;
    stats.solvingPerZIP[zip] = {
        avgDays: Math.round(avg * 10) / 10,
        unsolved: entry.unsolved,
        solved: entry.solved,
    };
}

const finalData: any = { items, zipcodes, generated, stats, count, properties };

const TARGET = 'src/_data/maengel.json';
FS.writeFile(TARGET, JSON.stringify(finalData, null, 2));

const finalData2: any = {
    items: openedItems,
    zipcodes,
    generated,
    stats,
    count: countOpen,
    properties,
};

const TARGET2 = 'src/_data/maengel_open.json';
FS.writeFile(TARGET2, JSON.stringify(finalData2, null, 2));
