/**
 * 🧪 Testing module HTTP
 * @module backend/_shared/HTTP
 * @version 0.0.1
 * @date 2025-09-18
 * @license MIT
 * @author Robert Willemelis <github.com/willi84>
 */
import {
    getConnectionTime,
    getHttpItemFromHeader,
    getHttpBase,
    getHttpStatusValue,
    getResponse,
    getHttpItem,
} from './http';
import * as cmd from '../cmd/cmd';
import {
    HTTP_OBJECT,
    MOCKED_URLS,
    DOMAIN_1,
    HTTP__301_TRIM,
    HTTP_CONTENT_301,
    STATUS,
} from './http.mocks';
import { getMockedResponse, MOCKED_RESPONSES } from './http.helper';
import { LOG } from '../log/log';

describe('CLASS: HTTP', () => {
    describe('✅ getHttpItemFromHeader()', () => {
        const FN = getHttpItemFromHeader;
        it('should result a 200 at forward step2', () => {
            const INPUT = MOCKED_RESPONSES.HTTP_200_FORWARD_1.step2;
            const EXPECTED = HTTP_OBJECT.HTTP_200;
            expect(FN(INPUT)).toEqual(EXPECTED);
        });
        it('should result a 301 at forward step1', () => {
            const INPUT = MOCKED_RESPONSES.HTTP_200_FORWARD_1.step1;
            const EXPECTED = HTTP_OBJECT.HTTP_301;
            expect(FN(INPUT)).toEqual(EXPECTED);
        });
        it('should result a 404 at forward step3', () => {
            const INPUT = MOCKED_RESPONSES.HTTP_404_FORWARD.step3;
            const EXPECTED = HTTP_OBJECT.HTTP_404;
            expect(FN(INPUT)).toEqual(EXPECTED);
        });
    });
    describe('✅ getConnectionTime()', () => {
        const FN = getConnectionTime;
        let mockCommand: jest.SpyInstance;
        beforeEach(() => {
            mockCommand = jest.spyOn(cmd, 'command').mockImplementation(() => {
                return '0.123';
            });
        });
        afterEach(() => {
            mockCommand.mockRestore();
        });
        it('should return connection time', () => {
            const INPUT = `https://www.${DOMAIN_1}/`;
            const EXPECTED = '0.123';
            expect(FN(INPUT)).toEqual(EXPECTED);
        });
    });
    describe('✅ getHttpStatusValue()', () => {
        const FN = getHttpStatusValue;
        let mockCommand: jest.SpyInstance;
        beforeEach(() => {
            mockCommand = jest
                .spyOn(cmd, 'command')
                .mockImplementation(getMockedResponse);
        });
        afterEach(() => {
            mockCommand.mockRestore();
        });
        describe('get next step response', () => {
            it('return 0', () => {
                const SCENARIO = MOCKED_URLS.HTTP_UNKOWN;
                expect(FN(SCENARIO.step1)).toEqual('0');
            });
            it('return 200 direct', () => {
                const SCENARIO = MOCKED_URLS.HTTP_200;
                expect(FN(SCENARIO.step1)).toEqual('200');
            });
            it('return 200 with forward', () => {
                const SCENARIO = MOCKED_URLS.HTTP_200_FORWARD_1;
                expect(FN(SCENARIO.step1)).toEqual('301');
                expect(FN(SCENARIO.step2)).toEqual('200');
            });
            it('return 404', () => {
                const SCENARIO = MOCKED_URLS.HTTP_404;
                expect(FN(SCENARIO.step1)).toEqual('404');
            });
            it('return 404 with forward', () => {
                const SCENARIO = MOCKED_URLS.HTTP_404_FORWARD;
                expect(FN(SCENARIO.step1)).toEqual('301');
                expect(FN(SCENARIO.step2)).toEqual('301');
                expect(FN(SCENARIO.step3)).toEqual('404');
            });
        });
        describe('get last step response', () => {
            it('return 0', () => {
                const SCENARIO = MOCKED_URLS.HTTP_404_FORWARD_MAX;
                expect(FN(SCENARIO.step1, true)).toEqual('0');
            });
            it('return 200 with forward 1', () => {
                const SCENARIO = MOCKED_URLS.HTTP_200_FORWARD_1;
                expect(FN(SCENARIO.step1, true)).toEqual('200');
                expect(FN(SCENARIO.step2, true)).toEqual('200');
            });
            it('return 200 with forward 2', () => {
                const SCENARIO = MOCKED_URLS.HTTP_200_FORWARD_2;
                expect(FN(SCENARIO.step1, true)).toEqual('200');
                expect(FN(SCENARIO.step2, true)).toEqual('200');
            });
            it('return 404', () => {
                const SCENARIO = MOCKED_URLS.HTTP_404_FORWARD;
                expect(FN(SCENARIO.step1, true)).toEqual('404');
            });
            it('return 0 with forward max', () => {
                const SCENARIO = MOCKED_URLS.HTTP_404_FORWARD_MAX;
                expect(FN(SCENARIO.step1, true)).toEqual('0');
            });
        });
    });
    describe('✅ getHttpBase()', () => {
        const FN = getHttpBase;
        let mockCommand: jest.SpyInstance;
        beforeEach(() => {
            mockCommand = jest
                .spyOn(cmd, 'command')
                .mockImplementation(getMockedResponse);
        });
        afterEach(() => {
            mockCommand.mockRestore();
        });
        it('should result a 200 at forward step2', () => {
            const INPUT = MOCKED_URLS.HTTP_200.step1;
            const EXPECTED = HTTP_OBJECT.HTTP_200;
            expect(FN(INPUT)).toEqual(EXPECTED);
        });
        it('should result a 200 at forward step2', () => {
            const INPUT = MOCKED_URLS.HTTP_200.step1;
            const EXPECTED = HTTP_OBJECT.HTTP_200;
            const result = FN(INPUT, 2);
            expect(result).toEqual(EXPECTED);
        });
        it('should result a 200 at forward step2', () => {
            const INPUT = MOCKED_URLS.HTTP_200.step1;
            const EXPECTED = HTTP_OBJECT.HTTP_200;
            const result = FN(INPUT, 0.2);
            expect(result).toEqual(EXPECTED);
        });
    });
    describe('✅ getHttpItem()', () => {
        const FN = getHttpItem;
        let mockCommand: jest.SpyInstance;
        beforeEach(() => {
            mockCommand = jest
                .spyOn(cmd, 'command')
                .mockImplementation(getMockedResponse);
        });
        afterEach(() => {
            mockCommand.mockRestore();
        });
        it('return 200 direct', () => {
            const INPUT = MOCKED_URLS.HTTP_200.step1;
            const EXPECTED = {
                ...HTTP_OBJECT.HTTP_200,
                lastLocation: `https://www.${DOMAIN_1}/`,
            };
            expect(FN(INPUT)).toEqual(EXPECTED);
        });
    });
    describe('✅ getResponse()', () => {
        const FN = getResponse;
        describe('base function', () => {
            const URL = 'google.de';
            it('should return http item with content (with untrimmed content)', () => {
                const mockResult = `${HTTP__301_TRIM}

                                    ${HTTP_CONTENT_301}`; // force trim
                const mockCommand = jest
                    .spyOn(cmd, 'command')
                    .mockImplementation(() => {
                        return mockResult;
                    });
                const EXPECTED = {
                    header: HTTP_OBJECT.HTTP_301_GOOGLE,
                    content: HTTP_CONTENT_301,
                    status: '301',
                    success: true,
                    time: expect.any(Number),
                };
                expect(FN(URL)).toEqual(EXPECTED);
                mockCommand.mockRestore();
            });
            it('should return http item with content but different header', () => {
                const mockResult = `${STATUS.HTTP_301}
    location: https://www.domain-2.de/

                                    ${HTTP_CONTENT_301}`; // force trim
                const mockCommand = jest
                    .spyOn(cmd, 'command')
                    .mockImplementation(() => {
                        return mockResult;
                    });
                const EXPECTED = {
                    header: HTTP_OBJECT.HTTP_301,
                    content: HTTP_CONTENT_301,
                    status: '301',
                    success: true,
                    time: expect.any(Number),
                };
                expect(FN(URL)).toEqual(EXPECTED);
                mockCommand.mockRestore();
            });
            it('should return content when no http header', () => {
                const mockResult = `<svg>`; // force trim
                const mockCommand = jest
                    .spyOn(cmd, 'command')
                    .mockImplementation(() => {
                        return mockResult;
                    });
                const EXPECTED = {
                    header: { status: '0' },
                    content: '<svg>',
                    status: '0',
                    success: false, // TODO
                    time: expect.any(Number),
                };
                expect(FN(URL)).toEqual(EXPECTED);
                mockCommand.mockRestore();
            });
        });
        describe('url specific', () => {
            let mockCommand: jest.SpyInstance;
            let spyLOG: jest.SpyInstance;
            beforeEach(() => {
                const mockResult = `${STATUS.HTTP_200}

                                    <svg>`; // force trim
                mockCommand = jest
                    .spyOn(cmd, 'command')
                    .mockImplementation(() => {
                        return mockResult;
                    });
                spyLOG = jest.spyOn(LOG, 'FAIL');
            });
            afterEach(() => {
                mockCommand.mockRestore();
                spyLOG.mockRestore();
            });
            describe('github', () => {
                const INPUT = 'https://api.github.com/icons/icon.svg';
                it('should return content when github url and token given', () => {
                    const EXPECTED = {
                        header: HTTP_OBJECT.HTTP_200,
                        content: '<svg>',
                        status: '200',
                        success: true,
                        time: expect.any(Number),
                    };

                    expect(FN(INPUT, { token: 'xxxx' })).toEqual(EXPECTED);
                    expect(spyLOG).not.toHaveBeenCalled();
                    expect(mockCommand).toHaveBeenCalledWith(
                        `curl -s -H "Authorization: token xxxx"   -i "${INPUT}" `
                    );
                });
                it('should return warning when token is missing', () => {
                    const EXPECTED = {
                        header: {}, // HTTP_OBJECT.HTTP_200,
                        content: '', // <= no content
                        status: '0',
                        success: false,
                        time: expect.any(Number),
                    };
                    expect(FN(INPUT)).toEqual(EXPECTED);
                    expect(spyLOG).toHaveBeenCalled();
                });
            });
            describe('gitlab', () => {
                const INPUT = 'https://api.gitlab.com/icons/icon.svg';
                it('should return content when github url and token given', () => {
                    const EXPECTED = {
                        header: HTTP_OBJECT.HTTP_200,
                        content: '<svg>',
                        status: '200',
                        success: true,
                        time: expect.any(Number),
                    };

                    expect(FN(INPUT, { token: 'xxxx' })).toEqual(EXPECTED);
                    expect(spyLOG).not.toHaveBeenCalled();
                    const ua = '-H "User-Agent: nodejs" ';
                    expect(mockCommand).toHaveBeenCalledWith(
                        `curl -s -H "PRIVATE-TOKEN: xxxx"  ${ua} -i "${INPUT}" `
                    );
                });
            });
        });
        describe('dev mode', () => {
            it('should log OK', () => {
                const spyLOG = jest.spyOn(LOG, 'OK');
                const mockResult = `${STATUS.HTTP_200}

                                    <svg>`; // force trim
                const mockCommand = jest
                    .spyOn(cmd, 'command')
                    .mockImplementation(() => {
                        return mockResult;
                    });
                FN('https://www.domain.de', { isDev: true });
                expect(spyLOG).toHaveBeenCalled();
                spyLOG.mockRestore();
                mockCommand.mockRestore();
            });
            it('should log INFO for > 400', () => {
                const spyLOG = jest.spyOn(LOG, 'INFO');
                const mockResult = `${STATUS.HTTP_404}

                                    <svg>`; // force trim
                const mockCommand = jest
                    .spyOn(cmd, 'command')
                    .mockImplementation(() => {
                        return mockResult;
                    });
                FN('https://www.domain.de', { isDev: true });
                expect(spyLOG).toHaveBeenCalled();
                spyLOG.mockRestore();
                mockCommand.mockRestore();
            });
        });
        describe('error handling', () => {
            it('should return 0 when there is no status code', () => {
                const spyLOG = jest.spyOn(LOG, 'WARN');
                const mockResult = ``; // force trim
                const mockCommand = jest
                    .spyOn(cmd, 'command')
                    .mockImplementation(() => {
                        return mockResult;
                    });
                const EXPECTED = {
                    header: {
                        status: '0',
                    },
                    content: '', // <= no content
                    status: '0',
                    success: false,
                    time: expect.any(Number),
                };
                expect(FN('https://www.domain.de')).toEqual(EXPECTED);
                expect(spyLOG).toHaveBeenCalledWith(
                    'no status code found. set to 0'
                );
                spyLOG.mockRestore();
                mockCommand.mockRestore();
            });
        });
    });
});
