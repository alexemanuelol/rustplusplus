/*
    Copyright (C) 2025 Alexander Emanuelsson (alexemanuelol)

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <https://www.gnu.org/licenses/>.

    https://github.com/alexemanuelol/rustplusplus

*/

import { log } from '../../index';

export type ValidationError = { key: string; value: any; expected: any };

export function getTypeOf(value: any): string {
    return value === null ? 'null' : typeof value;
}

export function isType(value: any, ...types: (string | null | undefined)[]): boolean {
    return types.some(type =>
        (type === null && value === null) || (type === undefined && value === undefined) || (typeof value === type)
    );
}

export function validateType(key: string, value: any, ...types: (string | null | undefined)[]):
    ValidationError | null {
    if (!isType(value, ...types)) {
        return { key: key, value: getTypeOf(value), expected: types }
    }
    return null;
}

export function validateInterface(key: string, value: any, validationCallback: (input: any) => boolean):
    ValidationError | null {
    if (!validationCallback(value)) {
        return { key: key, value: value, expected: 'unknown' }
    }

    return null;
}

export function validateArrayOfInterfaces(key: string, value: any, validationCallback: (input: any) => boolean):
    ValidationError | null {
    if (!Array.isArray(value)) {
        return { key: key, value: getTypeOf(value), expected: 'Array of interfaces' };
    }

    if (!value.every(validationCallback)) {
        return { key: key, value: 'unknown', expected: 'Array of interfaces' }
    }

    return null;
}

export function validateArrayOfTypes(key: string, value: any, ...types: (string | null | undefined)[]):
    ValidationError | null {
    if (!Array.isArray(value)) {
        return { key: key, value: getTypeOf(value), expected: `Array of types ${types.join(', ')}` };
    }

    /* Loop through each element in the array and check if its type is in the allowed types */
    for (const item of value) {
        let isValid = false;
        for (const type of types) {
            if (isType(item, type)) {
                isValid = true;
                break;
            }
        }

        if (!isValid) {
            /* If an invalid element is found, return the error */
            return { key: key, value: getTypeOf(item), expected: `Array of types ${types.join(', ')}` };
        }
    }

    return null;
}

export function validateObjectOfInterfaces(key: string, value: any, validationCallback: (input: any) => boolean):
    ValidationError | null {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
        return { key: key, value: getTypeOf(value), expected: 'Object of interfaces' };
    }

    for (const [objKey, objValue] of Object.entries(value)) {
        if (typeof objKey !== 'string' || typeof objValue !== 'object' || objValue === null || Array.isArray(objValue) || !validationCallback(objValue)) {
            return { key: key, value: 'unknown', expected: 'Object of interfaces' };
        }
    }

    return null;
}

export function validateNestedObjectOfInterfaces(key: string, value: any, validationCallback: (input: any) => boolean):
    ValidationError | null {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
        return { key: key, value: getTypeOf(value), expected: 'Nested object of interfaces' };
    }

    for (const [keyOuter, valueOuter] of Object.entries(value)) {
        if (typeof keyOuter !== 'string' || typeof valueOuter !== 'object' || valueOuter === null ||
            Array.isArray(valueOuter)) {
            return { key: key, value: getTypeOf(valueOuter), expected: 'Outer nested object of interfaces' };
        }

        for (const [keyInner, valueInner] of Object.entries(valueOuter)) {
            if (typeof keyInner !== 'string' || typeof valueInner !== 'object' || valueInner === null ||
                Array.isArray(valueInner) || !validationCallback(valueInner)) {
                return { key: key, value: 'unknown', expected: 'Inner nested object of interfaces' };
            }
        }
    }

    return null;
}

export function validateObjectOfTypes(key: string, value: any, ...types: (string | null | undefined)[]):
    ValidationError | null {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
        return { key: key, value: getTypeOf(value), expected: `Object of types ${types.join(', ')}` };
    }

    for (const [objKey, objValue] of Object.entries(value)) {
        if (typeof objKey !== 'string') {
            return { key: key, value: `objKey: ${typeof objKey}`, expected: `Object of types ${types.join(', ')}` };
        }

        let isValid = false;
        for (const type of types) {
            if (isType(objValue, type)) {
                isValid = true;
                break;
            }
        }

        if (!isValid) {
            return { key: key, value: `objValue: ${typeof objValue}`, expected: `Object of types ${types.join(', ')}` };
        }
    }

    return null;
}

export function logValidations(interfaceName: string, errors: ValidationError[], missingKeys: string[],
    unknownKeys: string[]) {
    const functionName = `isValid${interfaceName}`;
    const hasAllRequiredKeys = missingKeys.length === 0;
    const hasOnlyValidKeys = unknownKeys.length === 0;

    if (errors.length !== 0 || !hasAllRequiredKeys || !hasOnlyValidKeys) {
        log.error(`[${functionName}] Invalid ${interfaceName} object.`);
        if (errors.length !== 0) {
            errors.forEach(error => {
                log.error(`[${functionName}] Key: ${error.key}, Value: ${error.value}, Expected: ${error.expected}.`);
            });
        }
        if (!hasAllRequiredKeys) {
            log.error(`[${functionName}] Missing keys: ${missingKeys.join(', ')}.`);
        }
        if (!hasOnlyValidKeys) {
            log.error(`[${functionName}] Unknown keys: ${unknownKeys.join(', ')}.`);
        }
    }
}