import { getAllProjects } from '../gitlab/gitlab';
import * as http from '../http/http';
import { mockGetResponse } from '../mock/mock';
// import { toContainItems } from '../test/customMatcher/toContainItem/toContainItem';
// import { expect } from '@jest/globals';
// expect.extend({ toContainItem });

// mock data for multiple pages

const PROJECT_LIST_1_9 = [
    { id: 1, name: 'Project 1' },
    { id: 2, name: 'Project 2' },
    { id: 3, name: 'Project 3' },
    { id: 4, name: 'Project 4' },
    { id: 5, name: 'Project 5' },
    { id: 6, name: 'Project 6' },
    { id: 7, name: 'Project 7' },
    { id: 8, name: 'Project 8' },
    { id: 9, name: 'Project 9' },
];
// const PROJECT_LIST_1_8 = [
//     { id: 1, name: 'Project 1' },
//     { id: 2, name: 'Project 2' },
//     { id: 3, name: 'Project 3' },
//     { id: 4, name: 'Project 4' },
//     { id: 5, name: 'Project 5' },
//     { id: 7, name: 'Project 7' },
//     { id: 8, name: 'Project 8' },
//     { id: 9, name: 'Project 9' },
// ];
const PROJECT_LIST_EMPTY: any[] = [];

describe('getAllProjects()', () => {
    let responseSpy: jest.SpyInstance;
    // mock the getResponse function
    beforeEach(() => {
        jest.clearAllMocks();
        responseSpy = jest
            .spyOn(http, 'getResponse')
            .mockImplementation(mockGetResponse);
    });
    afterEach(() => {
        responseSpy.mockRestore();
    });

    it('should fetch all projects from GitLab', () => {
        const endpoint = 'https://gitlab.example.com/api/v4';
        const result = getAllProjects(endpoint, 'dummy', 2, 5); // checken ob zu wenig zurück: 2 statt 5
        expect(responseSpy).toHaveBeenCalledTimes(2);
        expect(result.items.length).toBe(9);
        expect(result.items).toEqual(PROJECT_LIST_1_9);
    });
    it('should return empty when missing header information', () => {
        const endpoint = 'https://gitlab.empty.com/api/v4';
        const result = getAllProjects(endpoint, 'dummy', 2, 5); // checken ob zu wenig zurück: 2 statt 5
        expect(responseSpy).toHaveBeenCalledTimes(1);
        expect(result.items.length).toBe(0);
        expect(result.items).toEqual(PROJECT_LIST_EMPTY);
    });
    it('should fetch all projects from GitLab when 2nd is flaky', () => {
        const endpoint = 'https://gitlab.flaky_0_1_0.com/api/v4';
        const result = getAllProjects(endpoint, 'dummy', 2, 5); // checken ob zu wenig zurück: 2 statt 5
        console.log(result.items);
        expect(responseSpy).toHaveBeenCalledTimes(3);
        expect(result.items.length).toBe(9);
        expect(result.items).toEqual(PROJECT_LIST_1_9);
    });
    it('should fetch all projects from GitLab when last is flaky', () => {
        const endpoint = 'https://gitlab.flaky_0_0_1.com/api/v4';
        const result = getAllProjects(endpoint, 'dummy', 3, 3); // checken ob zu wenig zurück: 2 statt 5
        expect(responseSpy).toHaveBeenCalledTimes(4);
        expect(result.items.length).toBe(9);
        expect(result.items).toEqual(PROJECT_LIST_1_9);

        // TODO: check which step was flaky
        // expect(result.logger.items).toContainItems({
        //     message: `Flaky response on page 2, retrying... [0/3]`,
        //     type: 'WARN',
        //     time: expect.any(Number),
        //     // telemetry: {
        //     //     nextTarget:
        //     //         'https://gitlab.flaky2.com/api/v4/projects?per_page=3&page=3',
        //     //     nextPage: 3,
        //     //     retry: 0,
        //     //     maxRetry: 3,
        //     // },
        // });
    });
    it('should fetch all projects from GitLab when last is flaky', () => {
        const endpoint = 'https://gitlab.flaky_1_0_0.com/api/v4';
        const result = getAllProjects(endpoint, 'dummy', 3, 3); // checken ob zu wenig zurück: 2 statt 5
        expect(responseSpy).toHaveBeenCalledTimes(4);
        expect(result.items.length).toBe(9);
        expect(result.items).toEqual(PROJECT_LIST_1_9);
    });
    it('should fetch no projects from GitLab when one round reached max-retry', () => {
        const endpoint = 'https://gitlab.flaky_4_0_0.com/api/v4';
        const result = getAllProjects(endpoint, 'dummy', 3, 3); // checken ob zu wenig zurück: 2 statt 5
        expect(responseSpy).toHaveBeenCalledTimes(4);
        expect(result.items.length).toBe(0);
        expect(result.items).toEqual(PROJECT_LIST_EMPTY);
    });
    it('should fetch all projects from GitLab even if it needs a re-try (flaky)', () => {
        const endpoint = 'https://gitlab.flaky_2_0_0.com/api/v4';
        const result = getAllProjects(endpoint, 'dummy', 3, 3); // checken ob zu wenig zurück: 2 statt 5
        expect(responseSpy).toHaveBeenCalledTimes(5);
        expect(result.items.length).toBe(9);
        expect(result.items).toEqual(PROJECT_LIST_1_9);
    });
    it('should fetch all projects from GitLab even if it needs 2 times a re-try (flaky)', () => {
        const endpoint = 'https://gitlab.flaky_2_0_1.com/api/v4';
        const result = getAllProjects(endpoint, 'dummy', 3, 3); // checken ob zu wenig zurück: 2 statt 5
        expect(responseSpy).toHaveBeenCalledTimes(6);
        expect(result.items.length).toBe(9);
        expect(result.items).toEqual(PROJECT_LIST_1_9);

        expect(result.logger.items).toContainItems({
            // TODO: multiple placeholder also withing []
            // TODO: received 3 items vs. undefined items
            message: `[3/3] [100ms] received 3 items from ${endpoint}/projects?per_page=3&page=3`,
            type: 'OK',
            time: '{number}',
            telemetry: {
                // foo: 23,
            },
        });
        expect(result.logger.items).toContainItems({
            message: 'Flaky response on page 1, retrying... [1/3]',
            type: 'WARN',
            time: '{number}',
            telemetry: {
                nextTarget: `${endpoint}/projects?per_page=3&page=1`,
                nextPage: 1,
                retry: 1,
                maxRetry: 3,
            },
        });
        expect(result.logger.items).toContainItems({
            message: 'Flaky response on page 3, retrying... [2/3]',
            type: 'WARN',
            time: '{number}',
            telemetry: {
                nextTarget: `${endpoint}/projects?per_page=3&page=3`,
                nextPage: 3,
                retry: 2,
                maxRetry: 3,
            },
        });
    });
});

// TODO: duplicated response
// TODO: not enought response doing re-try
// TODO: max-retries !!!!
// TODO: return logs

// 3x retry auf empty mit und ohne success
