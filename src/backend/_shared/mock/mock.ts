import { CurlItem } from '../../index.d';
import { LOG } from '../log/log';
import { FLAKY_SCENARIO, RETRY_DATA } from './mock.d';

const MAX_RETRIES = 3;
const FLAKY = 1;
const NO_FLAKY = 0;

/**
 * 🎯 create mocked data sets
 * @param {number} num ➡️ number of data-sets to create
 * @param {number} [start] ➡️ optional offset to start from (default: 1)
 * @returns {Array<{id: number, name: string}>} 📤 array of mocked data-sets
 */
export const createMockData = (
    num: number,
    start: number = 1
): { id: number; name: string }[] => {
    const mockData = [];
    for (let i = 0; i < num; i++) {
        const id = start + i;
        mockData.push({ id, name: `Project ${id}` });
    }
    return mockData;
};

/**
 * 🎯 get specified url parameter
 * @param {string} href ➡️ full url
 * @param {string} name ➡️ parameter name
 * @param {string} type ➡️ type of parameter (string|number|boolean)
 * @returns {any} 📤 value of parameter or null/NaN
 */
export const getGETParameter = (
    href: string,
    name: string,
    type: string
): any => {
    if (typeof window === 'undefined') {
        return type === 'number' ? NaN : null;
    }
    const url = new URL(encodeURI(href)); // Fallback-Base für relative URLs
    const value = url.searchParams.get(name); // string | null
    switch (type) {
        case 'number':
            return parseInt(value || '');
        case 'boolean':
            return value === 'true';
        default:
            return value;
    }
};
let beFlaky = false;
// let retrycount = 0;
const RETRY_COUNTS: RETRY_DATA = {};

/**
 * 🎯 get second level domain
 * @param {string} url ➡️ full url
 * @returns {string} 📤 second level domain or empty string
 */
export const getSLD = (url: string): string => {
    const match = url.match(/https?:\/\/([^/]+)/);
    if (match && match[1]) {
        const domain = match[1];
        const parts = domain.split('.');
        if (parts.length > 2) {
            return parts.slice(-2)[0]?.replace(/\./g, ''); //.join('.');
        }
        return parts[0];
    }
    return '';
};

export const isFlaky = (
    url: string,
    scenario: string,
    flakyScenario: FLAKY_SCENARIO,
    retrycounts: RETRY_DATA
) => {
    const currentPage = getGETParameter(url, 'page', 'number');

    const pageItem = flakyScenario[currentPage - 1];
    const currentRetry = retrycounts[scenario][currentPage] || 0;
    const beFlaky = pageItem
        ? pageItem[currentRetry]
            ? pageItem[currentRetry] === 1
            : false
        : false;
    if (beFlaky && retrycounts[scenario][currentPage] < MAX_RETRIES) {
        retrycounts[scenario][currentPage]++;
    } else {
        LOG.WARN(`Max retries reached for ${scenario} on page ${currentPage}`);
    }
    return beFlaky;
};

export const mockGetResponse = (url: string): CurlItem => {
    const total = 9;
    const totalPages = 5;
    // projects?per_page=${perPage}&page=${nextPage}
    const page: number = getGETParameter(url, 'page', 'number') || 1; // default page 1
    const perPage = getGETParameter(url, 'per_page', 'number');
    console.log(perPage);
    const scenario = getSLD(url);
    if (!RETRY_COUNTS[scenario]) {
        RETRY_COUNTS[scenario] = {};
    }
    if (!RETRY_COUNTS[scenario][page]) {
        RETRY_COUNTS[scenario][page] = 0;
    }
    if (scenario === 'empty') {
        return {
            content: '[]',
            header: { status: '0' },
            status: '200',
            success: true,
            time: 100,
        } as CurlItem;
    }
    // let flakyScenario: FLAKY_SCENARIO = [];
    const scenarios: { [key: string]: FLAKY_SCENARIO } = {
        flaky_0_1_0: [[NO_FLAKY], [FLAKY, NO_FLAKY]],
        flaky_0_0_1: [[NO_FLAKY], [NO_FLAKY], [FLAKY, NO_FLAKY]],
        flaky_1_0_0: [[FLAKY, NO_FLAKY]],
        flaky_4_0_0: [[FLAKY, FLAKY, FLAKY, FLAKY, NO_FLAKY]],
        flaky_2_0_0: [[FLAKY, FLAKY, NO_FLAKY]],
        flaky_2_0_1: [[FLAKY, FLAKY, NO_FLAKY], [], [FLAKY, NO_FLAKY]],
    };
    const flakyScenario: FLAKY_SCENARIO = scenarios[scenario] || [];
    beFlaky = isFlaky(url, scenario, flakyScenario, RETRY_COUNTS);
    // const maxValue = perPage * page;
    const nextPage = page + 1;
    // const offset = perPage * (page - 1) + 1;
    const startValue = (page - 1) * perPage + 1;
    const mockData = createMockData(
        perPage,
        // maxValue < total ? maxValue : total,
        // offset
        startValue
    );
    const finalData = beFlaky ? [mockData[0]] : mockData;
    return {
        content: JSON.stringify(finalData),
        header: {
            xTotalPages: `${Math.ceil(total / perPage)}`,
            xTotal: `${total}`,
            xNextPage: `${nextPage < totalPages ? nextPage : ''}`,
        },
        status: '200',
        success: true,
        time: 100,
    } as CurlItem;
};
