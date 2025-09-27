/**
 * 🧪 Testing module HTTP
 * @module backend/_shared/HTTP/helper
 * @version 0.0.1
 * @date 2025-09-18
 * @license MIT
 * @author Robert Willemelis <github.com/willi84>
 */
import { STANDARD_CURL_TIMEOUT } from './http.config';
import {
    getMockedResponse,
    getRealResponse,
    getResponseByUrl,
    getUrlID,
    MOCKED_RESPONSES,
    normalizeResponses,
} from './http.helper';
import { DOMAIN_1 } from './http.mocks';

describe('helper functions', () => {
    describe('✅ getRealResponse()', () => {
        it('should return response correct formatted', () => {
            const input = {
                msg: `
                    xxx
                    yyy
                    `,
            };
            const output = `xxx\r
yyy\r
\r
`;
            const result = getRealResponse(input.msg);
            expect(result).toEqual(output);
        });
    });
    describe('✅ normalizeResponses()', () => {
        const FN = normalizeResponses;
        it('should return normalized responses', () => {
            const input = {
                TEST: {
                    step1: `
                    ${'HTTP/1.0 200 OK'}
                    BB: CC; DD
                    `,
                    step2: `
                    ${'HTTP/2 404 Not found'}
                    BB: CC; DD
                    `,
                },
            };
            const output = {
                TEST: {
                    step1: `HTTP/1.0 200 OK\r\nBB: CC; DD\r\n\r\n`,
                    step2: `HTTP/2 404 Not found\r\nBB: CC; DD\r\n\r\n`,
                },
            };
            const result = FN(input);
            expect(result).toEqual(output);
        });
    });
    describe('✅ getUrlID()', () => {
        const FN = getUrlID;
        it('should return url from curl command', () => {
            const input = `curl -I -m 0.4 --silent https://www.google.de/`;
            const output = 'https://www.google.de/';
            const result = FN(input);
            expect(result).toEqual(output);
        });
        it('should return url from curl command with "', () => {
            const input = `curl -I -m 0.4 --silent "https://www.google.de/"`;
            const output = 'https://www.google.de/';
            const result = FN(input);
            expect(result).toEqual(output);
        });
        it('should return url from curl command with "', () => {
            const input = `curl -I -m 0.4 --silent 'https://www.google.de/'`;
            const output = 'https://www.google.de/';
            const result = FN(input);
            expect(result).toEqual(output);
        });
    });
    describe('✅ getResponseByUrl()', () => {
        const FN = getResponseByUrl;
        const RESPONSES = {
            HTTP_200: {
                step1: `HTTP/1.1 200 OK\r\nContent-Type: text/html; charset=UTF-8\r\n\r\n`,
            },
            HTTP_UNKNOWN: {
                step1: `curl: (6) Could not resolve host: unknown.de\r\n`,
            },
        };
        const URLS = {
            HTTP_200: {
                step1: 'https://www.domain.de/',
            },
            HTTP_UNKNOWN: {
                step1: 'https://www.unknown.de/',
            },
        };
        it('should return unknown response', () => {
            const input = `https://www.unknown.de/`;
            const output = RESPONSES.HTTP_UNKNOWN.step1;
            const result = FN(input, RESPONSES, URLS);
            expect(result).toEqual(output);
        });
        it('should return 200 response', () => {
            const input = `https://www.domain.de/`;
            const output = RESPONSES.HTTP_200.step1;
            const result = FN(input, RESPONSES, URLS);
            expect(result).toEqual(output);
        });
    });
    describe('✅ getMockedResponse()', () => {
        const FN = getMockedResponse;
        it('should test the testing usage', () => {
            const input = `curl -I -m ${STANDARD_CURL_TIMEOUT} --silent https://www.${DOMAIN_1}/`;
            const output = MOCKED_RESPONSES.HTTP_200.step1;
            const result = FN(input);
            expect(result).toEqual(output);
        });
    });
});
