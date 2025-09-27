import {
    COMPARE_STATE,
    ITEM,
    MatchItem,
    CustomMatchStatus,
    ValueItem,
} from './toContainItem.d';
import {
    matcherHint,
    printReceived,
    printExpected,
    printDiffOrStringify,
    RECEIVED_COLOR,
    // } = this.utils;
} from 'jest-matcher-utils';

import { CompareState } from './toContainItem.config';
import { getAllProps } from './props/props';
import { evaluateItemAccuracy, getTotalAccuracy } from './accuracy/accuracy';

// Level 1: exact match
// Level 2: no case and missing spaces
// level 3: partial match

export const compareItem = (
    expectedItem: ITEM,
    receivedItem: ITEM
): ValueItem[] => {
    const values: ValueItem[] = [];
    const allKeys: string[] = getAllProps(expectedItem, receivedItem);
    for (const key of allKeys) {
        const expected = expectedItem[key];
        const received = receivedItem[key];
        let accuracy = 0;
        let state: COMPARE_STATE = CompareState.EQUAL;
        if (
            expected === received &&
            (received === undefined || received === null)
        ) {
            state = CompareState.EQUAL;
            accuracy = 100;
        } else if (expected === undefined || expected === null) {
            state = CompareState.EXTRA;
        } else if (received === undefined || received === null) {
            state = CompareState.MISS;
        } else {
            const result = evaluateItemAccuracy(received, expected);
            // TODO: check placeholder
            if (result === 100) {
                state = CompareState.EQUAL;
            } else if (result >= 50) {
                state = CompareState.CONGRUENT;
            } else {
                state = CompareState.DIFF;
            }
            accuracy = result;
        }
        values.push({ key, expected, received, state, accuracy });
    }
    return values;
};
const processData = (receivedItem: any, expected: any, index: number) => {
    const values = compareItem(expected, receivedItem);
    let fullAccuracy = values.map((c) => c.accuracy);
    const accuracy = getTotalAccuracy(fullAccuracy);
    let state = getMatchingState(values);
    return {
        index,
        values,
        accuracy,
        state,
    };
};

export const getMatchingData = (
    receivedItems: ITEM[],
    expectedItem: ITEM
): CustomMatchStatus => {
    const matchingItems: MatchItem[] = [];
    let isValid = false;
    const diff = [];
    // let finalState = CompareState.EQUAL;
    if (!isValid) {
        const len = receivedItems.length;
        let i = 0;
        for (const receivedItem of receivedItems) {
            const newItem = processData(receivedItem, expectedItem, i);
            matchingItems.push(newItem);
            i += 1;
        }
        if (i !== len) {
            console.warn(
                `receivedItems length changed during processing: before=${len}, after=${i}`
            );
        }
    }
    // sort matchingItems by accuracy
    const result = matchingItems.sort((a, b) => b.accuracy - a.accuracy); ///.filter((mi) => mi.accuracy > 0);
    const finalResult = [];
    for (const r of result) {
        if (r.accuracy === 100) {
            isValid = true;
            finalResult.push(r);
            // break;
        } else {
            if (!isValid) {
                for (const v of r.values) {
                    if (v.state === r.state && v.state !== CompareState.EQUAL) {
                        diff.push({
                            ...v,
                            index: r.index,
                            accuracy: v.accuracy,
                        });
                        finalResult.push(r);
                        // finalState = r.state;
                        // break; // accuracy > 50
                    }
                }
                // diff.push(...r.values.filter((v) => v.state !== CompareState.EQUAL));
            }
        }
    }
    // isValid = diff.length === 0; //  result.filter((mi) => mi.accuracy === 100).length > 0;
    return {
        expected: expectedItem,
        received: receivedItems,
        found: finalResult.slice(0, 5), // max 5 items
        // found: finalResult, // max 5 items
        pass: isValid,
    };
};
export const getMatchingState = (
    valueItems: MatchItem[] | ValueItem[]
): COMPARE_STATE => {
    let state = CompareState.EQUAL;
    const status = valueItems
        .map((v) => v.state)
        .filter((s) => s !== CompareState.EQUAL);
    if (status.length === 0) {
        state = CompareState.EQUAL;
    } else if (status.length === 1) {
        state = status[0];
    } else {
        state = CompareState.MIXED;
    }
    return state;
};
// export const getMatchingMessage = (result: CustomMatchStatus): string => {
//     let message = '';
//     console.log(result);
//     if (result.pass) {
//         message = 'Expected item found in array.';
//     } else {
//         // for (const mi of result.found) {
//         //     const state = getMatchingState(mi.values);
//         //     message += `found ${mi.index + 1}. item with ${state} value\n`;
//         //     for (const v of mi.values) {
//         //         console.log(v)
//         //         if (v.state !== CompareState.EQUAL) {
//         //             // message += `❌ property "${v.key}" expected: {GREEN}${v.expected}{/GREEN}, received: {RED}${v.received} [${v.state}]{/RED}\n`;
//         //             console.log(v);
//         //             if (isBothSimpleValue(v.expected, v.received)) {
//         //                 message += `❌❌ property "${v.key}" expected: ${printExpected(
//         //                     v.expected
//         //                 )}, received: ${printReceived(v.received)} [${v.state}]\n`;
//         //                 message += `\n${printDiffOrStringify(
//         //                     v.expected,
//         //                     v.received,
//         //                     'expected',
//         //                     'received',
//         //                     false
//         //                 )}\n`;
//         //             } else {
//         //                 message += `❌\n ${printDiffOrStringify(v.expected, v.received, 'expected', 'received', false)}\n`;
//         //             }
//         //         } else {
//         //             message += `✅ property "${v.key}" [OK]\n`;
//         //         }
//         //     }
//         // }
//         if (result.found.length > 0) {
//             const ex = result.expected;
//             const rec = result.received[0];
//             if (isBothSimpleValue(ex, rec)) {
//                 message += `Expected: ${printExpected(ex)}\nReceived: ${printReceived(rec)}\n\n`;
//                 message += `Found ${result.found.length} similar items:\n ${printDiffOrStringify(result.expected, result.received[0], 'expected', 'received', true)}\n`;
//             } else {
//                 console.log(ex);
//                 console.log(typeof ex);
//                 console.log(rec);
//                 console.log(typeof rec);
//                 message +=
//                     `${matcherHint('.hasItem', 'object')}\n\n` +
//                     `${printDiffOrStringify(ex, rec, 'expected', 'received', true)}`;
//                 // message += `Expected and received are complex objects\n\n`;
//                 // message += `Found ${result.found.length} similar items:\n ${printDiffOrStringify(result.expected, result.received[0], 'expected', 'received', true)}\n`;
//             }
//             // message += `Found ${result.found.length} similar items:\n ${printDiffOrStringify(result.expected, result.received[0], 'expected', 'received', true)}\n`;
//         } else {
//             console.log('not found');
//         }
//     }
//     return message; //\n${printDiffOrStringify('expected', result.expected, 'received', result.received, true)}`;
//     // return `${message}`; //\n${printDiffOrStringify('expected', result.expected, 'received', result.received, true)}`;
// };
export const replacePlaceholder = (expected: any, received: any) => {
    let changedReceived = received;
    if (isBothSimpleValue(expected, received)) {
        console.log(` expected=${expected}, received=${received} }`);
        if (isStr(expected) && isPlaceholder(expected)) {
            const hasPlaceholder = isPlaceholder(expected);
            if (hasPlaceholder && hasPlaceholder === typeof received) {
                changedReceived = expected;
            }
        }
    } else if (isBothComplexValue(expected, received)) {
        const allKeys = getAllProps(expected, received);
        const newObj: any = {};
        for (const key of allKeys) {
            newObj[key] = replacePlaceholder(expected[key], received[key]);
        }
        changedReceived = newObj;
    }
    return changedReceived;
};

const makeFailMsg = (exp: any, rec: any, accuracy: number) => {
    const isObj = typeof rec === 'object' && rec !== null;
    const keys = isObj ? Object.keys(rec as Record<string, unknown>) : [];
    const newRec = replacePlaceholder(exp, rec);
    const diff = printDiffOrStringify(
        exp, // „Erwartet: hat foo“
        newRec, // „Erhalten: hat bar“
        'Expected',
        'Received',
        true
        // this.expand ?? false
    );
    return (
        `${matcherHint('.toContainItems', 'object')}\n\n` +
        `Expected object has different values then received (${accuracy}%) ${printExpected(exp)}.\n\n` +
        // `Expected: ${printExpected(exp)}\n` +
        // `Received: ${printReceived(rec)}\n` +
        (keys.length ? `Keys: ${RECEIVED_COLOR(keys.join(', '))}\n` : '') +
        // (similar ? `\nDid you mean ${printExpected(similar)}?\n` : '') +
        `\ndiff: ${diff}`
    );
};

const makePassMsg = (exp: any, rec: any) => {
    const isObj = typeof rec === 'object' && rec !== null;
    const val = isObj ? (rec as any).foo : undefined;
    const keys = isObj ? Object.keys(rec as Record<string, unknown>) : [];
    return (
        `${matcherHint('.not.toContainItems', 'object')}\n\n` +
        `Expected object NOT to have own property ${printExpected(exp)}, but it does.\n\n` +
        `Value at "foo": ${printReceived(val)}\n` +
        (keys.length ? `Keys: ${RECEIVED_COLOR(keys.join(', '))}\n` : '')
    );
};

export const toContainItems = (
    receivedItems: ITEM[],
    expectedItem: ITEM
): jest.CustomMatcherResult => {
    const result = getMatchingData(receivedItems, expectedItem);
    console.log(result);
    const validItems = result.found.filter((fi) => fi.accuracy > 50);
    console.log(validItems.length);
    const foundItem =
        result.found && result.found.length > 0 ? result.found[0] : null;
    const received = foundItem ? receivedItems[foundItem.index] : null;
    const expected = expectedItem;
    // const similar = keys.find((k) => k.toLowerCase().startsWith('foo'));
    const msg = result.pass
        ? makePassMsg(expected, received)
        : makeFailMsg(expected, received, foundItem?.accuracy || -1);
    return {
        message: () => msg,

        pass: result.pass,
    };
};

// TODO: placeholder
// TODO: CASE-sensitive
// TODO: CASE >50%

// level 1: exact match
// level 2: no case and missing spaces and wrong type (string/number/boolean)
// level 3: partial match
// level 4: different
// src/testing/matchers/hasFoo.ts

import { expect } from '@jest/globals';
import {
    isBothComplexValue,
    isBothSimpleValue,
    isPlaceholder,
    isStr,
} from './is/is';

expect.extend({ toContainItems });
