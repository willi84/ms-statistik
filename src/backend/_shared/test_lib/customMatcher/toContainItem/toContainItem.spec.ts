import { ITEM, MatchItem, ValueItem } from './toContainItem.d';
import {
    compareItem,
    getMatchingData,
    toContainItems,
    getMatchingState,
    replacePlaceholder,
} from './toContainItem';

import {
    CONGRUENT,
    DIFF,
    EQUAL,
    EXTRA,
    MISS,
    MIXED,
} from './toContainItem.config';

const $ = expect.objectContaining;

const A = 'Test';
const a = 'test';
const B = 'Example';
// const b = 'example';
const X = undefined;

const ID_1 = { id: 1 };
const ID_1_NAME_A = { id: 1, name: A };
const ID_1_NAME_a = { id: 1, name: a };
const ID_1_NAME_A_AGE_30 = { id: 1, name: A, age: 30 };
const ID_2_NAME_A = { id: 2, name: A };
// const ID_2_NAME_a = { id: 2, name: a };
const ID_1_NAME_B = { id: 1, name: B };
const ID_2_NAME_B = { id: 2, name: B };
const ID_1_NAME_OBJ_1 = { id: 1, name: { first: 'Test', last: 'User' } };
const ID_2_NAME_OBJ_1 = { id: 2, name: { first: 'Test', last: 'User' } };
const ID_1_NAME_OBJ_2 = { id: 1, name: { first: 'Test', last: 'User2' } };
const ID_2_NAME_OBJ_2 = { id: 2, name: { first: 'Test', last: 'User2' } };
const OBJ_1 = { first: 'Test', last: 'User' };
const OBJ_2 = { first: 'Test', last: 'User2' };

const ID_EQUAL = { key: 'id', state: EQUAL, accuracy: 100 };
const ID_DIFF = { key: 'id', state: DIFF, accuracy: 0 };
const NAME_EQUAL = { key: 'name', state: EQUAL, accuracy: 100 };
// const NAME_CONGRUENT = { key: 'name', state: CONGRUENT, accuracy: 50 };
const NAME_CONGRUENT = { key: 'name', state: CONGRUENT, accuracy: 87.5 };
const NAME_DIFF = { key: 'name', state: DIFF, accuracy: 0 };
const AGE_EXTRA = { key: 'age', state: EXTRA, accuracy: 0 };
const NAME_MISS = { key: 'name', state: MISS, accuracy: 0 };

describe('compareIte()', () => {
    const FN = compareItem;
    describe('level 1 - exact match', () => {
        it('should return equal states', () => {
            const result = FN(ID_1_NAME_A, ID_1_NAME_A);
            const EXPECTED = [
                { expected: 1, received: 1, ...ID_EQUAL },
                { expected: A, received: A, ...NAME_EQUAL },
            ];
            expect(result).toEqual(EXPECTED);
        });
        it('should return diff states', () => {
            const result = FN(ID_1_NAME_A, ID_2_NAME_A);
            const EXPECTED = [
                { expected: 1, received: 2, ...ID_DIFF },
                { expected: A, received: A, ...NAME_EQUAL },
            ];
            expect(result).toEqual(EXPECTED);
        });
        it('should return diff states', () => {
            const result = FN(ID_1_NAME_A, ID_1_NAME_B);
            const EXPECTED = [
                { expected: 1, received: 1, ...ID_EQUAL },
                { expected: A, received: B, ...NAME_DIFF },
            ];
            expect(result).toEqual(EXPECTED);
        });
        it('should return extra states', () => {
            const result = FN(ID_1_NAME_A, ID_1_NAME_A_AGE_30);
            const EXPECTED = [
                { expected: 1, received: 1, ...ID_EQUAL },
                { expected: A, received: A, ...NAME_EQUAL },
                { expected: undefined, received: 30, ...AGE_EXTRA },
            ];
            expect(result).toEqual(EXPECTED);
        });
        it('should return missing states', () => {
            const result = FN(ID_1_NAME_A, ID_1);
            const EXPECTED = [
                { expected: 1, received: 1, ...ID_EQUAL },
                { expected: A, received: X, ...NAME_MISS },
            ];
            expect(result).toEqual(EXPECTED);
        });
        it('should return congruent states', () => {
            const expected = { id: 1, name: A };
            const received = { id: 1, name: a };
            const result = FN(expected, received);
            const EXPECTED = [
                { expected: 1, received: 1, ...ID_EQUAL },
                { expected: A, received: a, ...NAME_CONGRUENT },
            ];
            expect(result).toEqual(EXPECTED);
        });
        it('should return equal states for undefined', () => {
            const expected = { id: 1, name: X };
            const received = { id: 1, name: X };
            const result = FN(expected, received);
            const EXPECTED = [
                { expected: 1, received: 1, ...ID_EQUAL },
                { expected: X, received: X, ...NAME_EQUAL },
            ];
            expect(result).toEqual(EXPECTED);
        });
        it('should return diff states for objects', () => {
            const result = FN(ID_1_NAME_OBJ_1, ID_1_NAME_OBJ_2);
            const EXPECTED = [
                { expected: 1, received: 1, ...ID_EQUAL },
                {
                    expected: OBJ_1,
                    received: OBJ_2,
                    ...NAME_CONGRUENT,
                    accuracy: 90,
                },
            ];
            expect(result).toEqual(EXPECTED);
        });
    });
});
describe('getMatchingData()', () => {
    const expected = ID_1_NAME_A;
    describe('valid', () => {
        const pass = true;
        it('should succeed when equal item value found', () => {
            const received = [ID_1_NAME_A, ID_2_NAME_B];
            const result = getMatchingData(received, expected);
            const values = [
                { expected: 1, received: 1, ...ID_EQUAL },
                { expected: A, received: A, ...NAME_EQUAL },
            ];
            const found: MatchItem[] = [
                { index: 0, values, state: EQUAL, accuracy: 100 },
            ];
            const EXPECTED = { expected, received, found, pass };
            expect(result).toEqual(EXPECTED);
        });
        it('should succeed when multiple equal items value found', () => {
            const received = [ID_1_NAME_A, ID_2_NAME_B, ID_1_NAME_A];
            const result = getMatchingData(received, expected);
            const values = [
                { expected: 1, received: 1, ...ID_EQUAL },
                { expected: A, received: A, ...NAME_EQUAL },
            ];
            const found: MatchItem[] = [
                { index: 0, values, state: EQUAL, accuracy: 100 },
                { index: 2, values, state: EQUAL, accuracy: 100 },
            ];
            const EXPECTED = { expected, received, found, pass };
            expect(result).toEqual(EXPECTED);
        });
        it('should succeed when equal item obj found', () => {
            const expected = ID_1_NAME_OBJ_1;
            const received = [ID_1_NAME_OBJ_2, ID_1_NAME_OBJ_1];
            const result = getMatchingData(received, expected);
            const val = [
                { expected: 1, received: 1, ...ID_EQUAL },
                { expected: OBJ_1, received: OBJ_1, ...NAME_EQUAL },
            ];
            const found: MatchItem[] = [
                { index: 1, values: val, accuracy: 100, state: EQUAL },
            ];
            const EXPECTED = { expected, received, found, pass };
            expect(result).toEqual(EXPECTED);
        });
    });
    describe('invalid', () => {
        const pass = false;
        it('fail when its empty', () => {
            const received: ITEM[] = [];
            const result = getMatchingData(received, expected);
            const found: MatchItem[] = [];
            const EXPECTED = { expected, received, found, pass };
            expect(result).toEqual(EXPECTED);
        });
        it('#B fail when item has extra property', () => {
            const received = [ID_1_NAME_A_AGE_30, ID_2_NAME_B];
            const result = getMatchingData(received, expected);
            const values = [
                { expected: 1, received: 1, ...ID_EQUAL },
                { expected: A, received: A, ...NAME_EQUAL },
                { expected: undefined, received: 30, ...AGE_EXTRA },
            ];
            const found: MatchItem[] = [
                { index: 0, values, accuracy: 66.7, state: EXTRA },
            ];
            const EXPECTED = { expected, received, found, pass };
            expect(result).toEqual(EXPECTED);
        });
        it('#C fail when item has missing property', () => {
            const received = [ID_1, ID_2_NAME_B];
            const result = getMatchingData(received, expected);
            const values = [
                { expected: 1, received: 1, ...ID_EQUAL },
                { expected: A, received: undefined, ...NAME_MISS },
            ];
            const found: MatchItem[] = [
                { index: 0, values, accuracy: 50, state: MISS },
            ];
            const EXPECTED = { expected, received, found, pass };
            expect(result).toEqual(EXPECTED);
        });
        it('fail when item has different value', () => {
            const received = [ID_2_NAME_A, ID_2_NAME_B];
            const result = getMatchingData(received, expected);
            const values = [
                { expected: 1, received: 2, ...ID_DIFF },
                { expected: A, received: A, ...NAME_EQUAL },
            ];
            const found: MatchItem[] = [
                { index: 0, values: values, accuracy: 50, state: DIFF },
            ];
            const EXPECTED = { expected, received, found, pass };
            expect(result).toEqual(EXPECTED);
        });
        it('should fail when item has different value in case (CONGRUENT)', () => {
            const received = [ID_1_NAME_a, ID_2_NAME_B];
            const result = getMatchingData(received, expected);
            const values = [
                $({ key: 'id', expected: 1, received: 1, state: EQUAL }),
                $({ key: 'name', expected: A, received: a, state: CONGRUENT }),
            ];
            const found: MatchItem[] = [
                { index: 0, values, accuracy: 93.8, state: CONGRUENT },
            ];
            const EXPECTED = { expected, received, found, pass };
            expect(result).toEqual(EXPECTED);
        });
        it('should fail when item has different obj value in case (CONGRUENT)', () => {
            const expected = ID_1_NAME_OBJ_1;
            const received = [ID_1_NAME_OBJ_2, ID_2_NAME_OBJ_2];
            const result = getMatchingData(received, expected);
            const values = [
                { expected: 1, received: 1, ...ID_EQUAL },
                {
                    expected: OBJ_1,
                    received: OBJ_2,
                    ...NAME_CONGRUENT,
                    accuracy: 90, // overwrite of NAME_CONGRUENT
                },
            ];
            const found: MatchItem[] = [
                { index: 0, values, accuracy: 95, state: CONGRUENT },
            ];
            const EXPECTED = { expected, received, found, pass };
            expect(result).toEqual(EXPECTED);
        });
        describe('complex results', () => {
            it('should fail when item has partly different values', () => {
                const expected = ID_1_NAME_OBJ_1;
                const received = [ID_1_NAME_OBJ_2, ID_2_NAME_OBJ_1];
                const result = getMatchingData(received, expected);
                const val1 = [
                    { expected: 1, received: 1, ...ID_EQUAL },
                    {
                        expected: OBJ_1,
                        received: OBJ_2,
                        ...NAME_CONGRUENT,
                        accuracy: 90, // overwrite of NAME_CONGRUENT
                    },
                ];
                const val2 = [
                    { expected: 1, received: 2, ...ID_DIFF },
                    { expected: OBJ_1, received: OBJ_1, ...NAME_EQUAL },
                ];
                const found: MatchItem[] = [
                    { index: 0, values: val1, accuracy: 95, state: CONGRUENT },
                    { index: 1, values: val2, accuracy: 50, state: DIFF },
                ];
                const EXPECTED = { expected, received, found, pass };
                expect(result).toEqual(EXPECTED);
            });
            it('should fail when item has partly different values', () => {
                const expected = ID_1_NAME_OBJ_1;
                const received = [ID_1_NAME_OBJ_2, ID_2_NAME_OBJ_2];
                const result = getMatchingData(received, expected);
                const val1 = [
                    { expected: 1, received: 1, ...ID_EQUAL },
                    {
                        expected: OBJ_1,
                        received: OBJ_2,
                        ...NAME_CONGRUENT,
                        accuracy: 90, // overwrite of NAME_CONGRUENT
                    },
                ];
                const found: MatchItem[] = [
                    { index: 0, values: val1, accuracy: 95, state: CONGRUENT },
                ];
                const EXPECTED = { expected, received, found, pass };
                expect(result).toEqual(EXPECTED);
            });
        });
    });
    // TODO: mehrfach nearly matches, priorities je property (e.g id, name, type)
    // TODO: mixed types
});
describe(' getMatchingState()', () => {
    const FN = getMatchingState;
    const values: ValueItem[] = []; // empty mocked
    it('should return EQUAL', () => {
        const input = [{ index: 0, values, accuracy: 100, state: EQUAL }];
        const result = FN(input);
        expect(result).toBe(EQUAL);
    });
    it('should return DIFF', () => {
        const input = [{ index: 0, values, accuracy: 50, state: DIFF }];
        const result = FN(input);
        expect(result).toBe(DIFF);
    });
    it('should return CONGRUENT', () => {
        const input = [{ index: 0, values, accuracy: 90, state: CONGRUENT }];
        const result = FN(input);
        expect(result).toBe(CONGRUENT);
    });
    it('should return MIXED', () => {
        const input = [
            { index: 0, values, accuracy: 90, state: CONGRUENT },
            { index: 1, values, accuracy: 50, state: DIFF },
        ];
        const result = FN(input);
        expect(result).toBe(MIXED);
    });
});
xdescribe('toContainItem()', () => {
    const FN = toContainItems;
    describe('valid', () => {
        xit('should return pass true', () => {
            const received = [ID_1_NAME_A, ID_2_NAME_B];
            const expected = ID_1_NAME_A;
            const result = FN(received, expected);
            const EXPECTED = { message: expect.any(Function), pass: true };
            expect(result).toEqual(EXPECTED);
            expect(result.message()).toEqual('xxx');
        });
    });
    describe('invalid', () => {
        xit('should return pass false', () => {
            const received = [ID_2_NAME_A, ID_2_NAME_B];
            const expected = ID_1_NAME_A;
            const result = FN(received, expected);
            const EXPECTED = { message: expect.any(Function), pass: false };
            const MSG = `found 1. item with different value
            ❌ property "id" expected: {GREEN}1{/GREEN}, received: {RED}2 [different]{/RED}
            ✅ property "name" [OK]
        `;
            expect(result).toEqual(EXPECTED);
            const EXPECTED_MSG = MSG.replace(/\n\s+/g, '\n').trim();
            expect(result.message()).toEqual(`${EXPECTED_MSG}\n`);
            //
            // expect(result.message()).toEqual(MSG.replace(/\s+/g, ' ').trim());
        });
    });
});
// properties
// types
// content

// message checke `has something like ${number} for ${string}`
// 1st, 2nd, 3rd, 4th, 5th priority

describe('replacePlaceholder()', () => {
    const FN = replacePlaceholder;
    describe('simple', () => {
        it('should replace received value with expected placeholder', () => {
            expect(FN('{string}', 'test')).toEqual('{string}');
            expect(FN('{number}', 22)).toEqual('{number}');
            expect(FN('{boolean}', true)).toEqual('{boolean}');
            expect(FN('{boolean}', false)).toEqual('{boolean}');
        });
    });
    describe('complex', () => {
        it('should replace received object values with expected placeholders', () => {
            const expected = {
                id: '{number}',
                name: '{string}',
                active: '{boolean}',
            };
            const received = { id: 1, name: 'Test', active: true };
            const result = FN(expected, received);
            expect(result).toEqual(expected);
        });
        it('should not replace received object values with different expected placeholders', () => {
            const expected = {
                id: '{number}',
                name: '{string}',
                active: '{boolean}',
            };
            const received = { id: '1', name: 'Test', active: 'true' };
            const EXPECTED = { id: '1', name: '{string}', active: 'true' };
            const result = FN(expected, received);
            expect(result).toEqual(EXPECTED);
        });
        it('should replace partly placeholder values', () => {
            const expected = {
                id: '{number}',
                name: 'User {string} value',
                active: '{boolean}',
            };
            const received = {
                id: 1,
                name: 'User Test value',
                active: true,
            };
            const EXPECTED = {
                id: '{number}',
                name: 'User {string} value',
                active: '{boolean}',
            };
            const result = FN(expected, received);
            expect(result).toEqual(EXPECTED);
        });
    });
});
