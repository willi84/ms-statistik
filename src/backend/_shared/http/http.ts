/**
 * 🎯 A utility class for http handling
 * @module backend/_shared/HTTP
 * @example getResponse('https://www.domain.de');
 * @version 0.0.1
 * @date 2025-09-19
 * @license MIT
 * @author Robert Willemelis <github.com/willi84>
 */

import { CurlItem, HTTPStatusBase } from '../../index.d';
import { command } from '../cmd/cmd';
import {
    convert2KeyValue,
    convertKey2CamelCase,
    convertNumber2String,
} from '../convert/convert';
import { LOG } from '../log/log';
import { CURL_CONFIG_STATUS, STANDARD_CURL_TIMEOUT } from './http.config';

/**
 * 🎯 get minimal http item
 * @param {string} header ➡️ The raw HTTP header string.
 * @returns {HTTPStatusBase} 📤 The parsed HTTP status object.
 */
export const getHttpItemFromHeader = (header: string): HTTPStatusBase => {
    const httpItem: any = {};
    const lines = header
        .split('\n')
        .filter((line: string) => line.trim() !== '');
    lines.forEach((line: string) => {
        const item = convert2KeyValue(line.trim());
        const key = convertKey2CamelCase(item.key);

        if (key.trim() !== '') {
            // avoid empty key
            httpItem[`${key}`] = item.value;
        }
        // detect httpStatus
        if (key.indexOf('http/') === 0) {
            const version = key.split('/')[1];
            httpItem.protocol = 'http';
            httpItem.protocolVersion = version;
            httpItem.status = item.value.split(' ')[0];
            httpItem.statusMessage = item.value
                .replace(httpItem.status, '')
                .trim();
        }
    });
    if (httpItem.status === undefined) {
        httpItem.status = '0';
        LOG.WARN('no status code found. set to 0');
    }
    return httpItem;
};

/**
 * 🎯 get the time of connecting to an url
 * @param {string} url ➡️ The URL to connect to.
 * @returns {string} 📤 The connection time in seconds as a string.
 */
export const getConnectionTime = (url: string): string => {
    // return just time
    const cmd = `curl -o /dev/null -s -w '%{time_total}\\n' ${url}`;
    const status = command(`${cmd}`);
    return status;
};

/**
 * 🎯 get http status value from specified url
 * @param {string} url ➡️ The URL to check.
 * @param {boolean} forwarding ➡️ Whether to follow redirects.
 * @param {number} [timeout] ➡️ Optional timeout in seconds.
 * @returns {string} 📤 The HTTP status code as a string.
 */
export const getHttpStatusValue = (
    url: string,
    forwarding = false,
    timeout?: number
) => {
    const httpItem = getHttpItem(url, forwarding, timeout);
    if (httpItem['maxRedirectsReached']) {
        LOG.FAIL(`max redirects reached for ${url}`);
    }
    return httpItem['status'];
};

/**
 * 🎯 get base http item for url
 * @param {string} url ➡️ The URL to check.
 * @param {number} [timeout] ➡️ Optional timeout in seconds.
 * @returns {HTTPStatusBase} 📤 The parsed HTTP status object.
 * @returns
 */
export const getHttpBase = (url: string, timeout?: number): HTTPStatusBase => {
    const oldTime = convertNumber2String(STANDARD_CURL_TIMEOUT);
    const newTime = convertNumber2String(timeout || STANDARD_CURL_TIMEOUT);
    let config = timeout
        ? CURL_CONFIG_STATUS.replace(oldTime, newTime)
        : CURL_CONFIG_STATUS;
    const fullCommand = `curl -I ${url} ${config}`;
    const status = command(`${fullCommand}`);
    const httpItem = getHttpItemFromHeader(status);
    return httpItem;
};

/**
 * 🎯 get base http item for url with forwarding
 * @todo refactor with getHttpBase and getResponse
 * @todo forwarding and timeout as optional paramaters
 * @param {string} url ➡️ The URL to check.
 * @param {number} [timeout] ➡️ Optional timeout in seconds.
 * @param {boolean} forwarding ➡️ Whether to follow redirects.
 * @returns {HTTPStatusBase} 📤 The parsed HTTP status object.
 */
export const getHttpItem = (
    url: string,
    forwarding = false,
    timeout?: number
): HTTPStatusBase => {
    const initialUrl = url;
    const maxRedirects = 5;
    let redirects = 0;
    let httpItem: HTTPStatusBase = {} as HTTPStatusBase;
    if (forwarding) {
        while (forwarding) {
            redirects += 1;
            httpItem = getHttpBase(url, timeout);
            if (redirects > maxRedirects) {
                httpItem['maxRedirectsReached'] = 'true';
                httpItem['lastStatus'] = httpItem['status'];
                httpItem['status'] = '0';
                httpItem['redirects'] = `${redirects}`;
                httpItem['lastLocation'] = url;
                httpItem['initialUrl'] = initialUrl;
                LOG.FAIL(`max redirects reached for ${url}`);
                return httpItem;
            } else {
                // TODO: check valid url
                const location = httpItem['location'];
                if (location) {
                    url = location;
                } else {
                    forwarding = false;
                    httpItem['initialUrl'] = initialUrl; // TODO: testing
                    httpItem['lastLocation'] = url; // TODO: testing
                    httpItem['redirects'] = `${redirects}`;
                    return httpItem;
                }
            }
        }
    } else {
        httpItem = getHttpBase(url, timeout);
        httpItem['lastLocation'] = url;
    }
    return httpItem;
};

/**
 * 🎯 get full response for url
 * @todo refactor with getHttpItem
 * @param {string} url ➡️ The URL to fetch.
 * @param {object} [opts] ➡️ Optional settings (e.g., token, isDev).
 * @returns {CurlItem} 📤 The response object containing header, content, status, success, and time.
 */
export const getResponse = (url: string, opts: any = {}): CurlItem => {
    const token = (opts as any).token || '';
    const isDev = (opts as any).isDev || false;
    const start = new Date().getTime();
    const isGithubApi = url.indexOf('api.github.com') !== -1;
    const isGitlabApi = url.indexOf('gitlab') !== -1;

    if (isGithubApi && !token) {
        LOG.FAIL('Please set a GITHUB_TOKEN in the environment variables.');
        return {
            header: {},
            content: '',
            status: '0',
            success: false,
            time: new Date().getTime() - start,
        };
    }

    // setup auth header if token is provided
    const TOKEN_KEYS: { [key: string]: string } = {
        github: 'Authorization: token',
        gitlab: 'PRIVATE-TOKEN:',
    };
    const urlKey = isGithubApi ? 'github' : isGitlabApi ? 'gitlab' : 'default';
    const auth = `${TOKEN_KEYS[urlKey] ? `-H "${TOKEN_KEYS[urlKey]} ${token}" ` : ''}`;

    const ua = isGithubApi ? '' : '-H "User-Agent: nodejs" ';
    // encodeURI important to avoid issues
    const finalCommand = `curl -s ${auth} ${ua} -i "${encodeURI(url)}" `;
    const rawData = command(finalCommand);
    let data = rawData.replace(/^\n/, ''); // remove first empty line if exists
    const splitted = data.split(/\r?\n\r?\n/);
    const header = splitted[0];
    const httpItem = getHttpItemFromHeader(header);
    // all splitted except 0
    // TODO: check if hasHeader for opencode
    const hasHeader =
        httpItem['status'] !== undefined && httpItem['status'] !== '0';
    const content = hasHeader ? splitted.slice(1).join('\n') : data;
    const status = parseInt(httpItem.status, 10) || 0;
    const success = status >= 200 && status < 400;
    if (isDev) {
        const type = success ? 'OK' : 'INFO';
        LOG[type](`Response: ${url}: ${status} - ${httpItem.statusMessage}`);
    }
    // TODO: handling rate limits in extra function
    // if (isGithubApi) {
    //     const keysRemain = ['x-ratelimit-remaining', 'xRatelimitRemaining'];
    //     const keysLimit = ['x-ratelimit-limit', 'xRatelimitLimit'];
    //     const remaining = parseInt(getHttpProp(httpItem, keysRemain), 10);
    //     const limit = parseInt(getHttpProp(httpItem, keysLimit), 10);
    //     if (remaining && limit) {
    //         remainingTokenWarning(limit, remaining);
    //     } else {
    //         LOG.WARN('No rate limit information found in response headers');
    //     }
    // }
    return {
        header: httpItem,
        content: content.trim(), // TODO: check trim()
        status: status.toString(),
        success: success,
        time: new Date().getTime() - start,
    };
};
