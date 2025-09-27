import { CurlItem, HTTPStatusBase } from '../../index.d';
import { colors } from '../colors';
import { getResponse } from '../http/http';
import { colorize, LogType, _LOG } from '../log/log';

const MAX_RETRIES = 3;

export type LogItem = {
    message: string;
    type: LogType;
    time: number;
    telemetry?: any;
};

export type ProjectResult = {
    items: any[];
    logger: _LOG;
    // logs: LogItem[];
};

export const getAllProjects = (
    endpoint: string,
    token: string,
    maxPage: number = -1,
    perPage: number = 100,
    _log: _LOG = new _LOG()
): ProjectResult => {
    let nextPage = 1;
    let maxRetry = 0;
    // let maxRetry = 3;
    const finalResult = [];
    // const logItems: LogItem[] = [];
    // https://gitlab.opencode.de/api/v4/projects?page=2&per_page=100
    const cmd = `projects?per_page=${perPage}&page=${nextPage}`;
    const TARGET = `${endpoint}/${cmd}`;

    const result: CurlItem = getResponse(`${TARGET}`, { token });
    console.log(result);
    // console.log(result.time)
    const xTotalPages = (result?.header as HTTPStatusBase)?.['xTotalPages'];
    const xTotal = (result?.header as HTTPStatusBase)?.['xTotal'];
    const maxAvailablePages = parseInt(xTotalPages, 10);
    console.log(xTotalPages, xTotal);
    const maxAvailableItems = parseInt(xTotal, 10);
    const IDS: number[] = [];
    console.log(`Max available items: ${maxAvailableItems}`);
    if (isNaN(maxAvailablePages)) {
        _log.WARN(`No xTotalPages header found in response from ${TARGET}`);
        // LOG.WARN(`No xTotalPages header found in response from ${TARGET}`);
        return {
            items: [],
            logger: _log,
            // logs: logItems,
        };
    }
    const maxPages = maxPage === -1 ? maxAvailablePages : maxPage;
    if (maxPages < 1) {
        _log.WARN(`Invalid maxPage value: ${maxPage}`);
        // LOG.WARN(`Invalid maxPage value: ${maxPage}`);
        console.log(
            `maxPage: ${maxPage}, maxAvailablePages: ${maxAvailablePages}`
        );
        return {
            items: [],
            logger: _log,
            // logs: logItems,
        };
    }
    _log.DEBUG(`Max pages: ${maxPages}`);
    if (result?.content === '') {
        return {
            items: [],
            logger: _log,
            // logs: logItems,
        };
    }
    const projects = JSON.parse(result?.content || '[]');
    _log.OK(
        `[${nextPage}/${maxPages}][${colorize(result.time + 'ms', colors.BgBlack, colors.FgYellow)}] received ${projects.length} items from ${TARGET}`
    );
    // for (const project of projects) {
    //     if (!IDS.includes(project.id)) {
    //         IDS.push(project.id);
    //         finalResult.push(project);
    //     }
    // }
    const xNextPage = (result?.header as HTTPStatusBase)?.['xNextPage'];
    nextPage = parseInt(xNextPage, 10) || 0;
    // let i = nextPage;
    const isFlaky = projects.length !== perPage;
    if (isFlaky) {
        nextPage--;
        maxRetry++;
    } else {
        for (const project of projects) {
            if (!IDS.includes(project.id)) {
                IDS.push(project.id);
                finalResult.push(project);
            }
        }
    }
    // finalResult.push(...projects);
    console.log(`Next page: ${nextPage}`);
    if (nextPage > 0) {
        _log.DEBUG(`Next page: ${nextPage}`);
        for (let i = nextPage; i <= maxPages && i <= maxPages; i++) {
            // pageI = i;
            nextPage = i;
            if (nextPage > maxPages || nextPage === 0) {
                _log.WARN(`No more items found for ${TARGET} on page ${i}`);
                break;
            }
            const nextCmd = `projects?per_page=${perPage}&page=${nextPage}`;
            const nextTarget = `${endpoint}/${nextCmd}`;
            // console.log(`Fetching next page: ${nextTarget}`);
            const nextResult = getResponse(`${nextTarget}`, { token });
            // console.log(nextResult.time)
            if (nextResult && nextResult.content) {
                const nextProjects = JSON.parse(nextResult.content || '[]');
                _log.OK(
                    `[${nextPage}/${maxPages}] [${nextResult.time}ms] received ${nextProjects.length} items from ${nextTarget}`
                );

                // TODO: wird nicht als Ergebnis
                // _log.OK(
                //     `[${nextPage}/${maxPages}] [${nextResult.time}ms] received ${nextProjects.length} item from ${nextTarget}`
                // );
                const isLastIteration = i === maxPage;
                console.log(typeof maxAvailableItems);
                const isValid =
                    nextProjects.length + finalResult.length !==
                    maxAvailableItems;
                    console.log(nextProjects.length, finalResult.length, maxAvailableItems);
                const isFlaky = isLastIteration
                    ? isValid
                    : nextProjects.length !== perPage;
                if (isFlaky) {
                    if (maxRetry < MAX_RETRIES) {
                        i--;
                        _log.WARN(
                            `Flaky response on page ${nextPage}, retrying... [${maxRetry}/${MAX_RETRIES}]`,
                            {
                                nextTarget,
                                nextPage,
                                retry: maxRetry,
                                maxRetry: MAX_RETRIES,
                            }
                        );
                        maxRetry++;
                    } else {
                        _log.FAIL(
                            `Max retries reached for ${nextTarget} on page ${nextPage}, stopping...`
                        );
                        return {
                            items: finalResult,
                            logger: _log,
                            // logs: logItems,
                        };
                    }
                } else {
                    for (const nextProject of nextProjects) {
                        if (!IDS.includes(nextProject.id)) {
                            IDS.push(nextProject.id);
                            finalResult.push(nextProject);
                        }
                    }
                }

                // finalResult.push(...nextProjects);
            } else {
                _log.WARN(
                    `No more items found for ${nextTarget} on page ${nextPage}`
                );
                break;
            }
            // nextPage = parseInt(nextResult?.header['xNextPage'], 10) || 0;
            // console.log(nextResult?.header)
        }
    }
    return {
        items: finalResult,
        logger: _log,
        // logs: logItems,
    };
};
