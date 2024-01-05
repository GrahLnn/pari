'use client';
import { invoke } from "@tauri-apps/api";

// A utility function to deep freeze an object
function deepFreeze(object) {
    Object.getOwnPropertyNames(object).forEach(name => {
        const prop = object[name];
        if (typeof prop === 'object' && prop !== null) {
            deepFreeze(prop);
        }
    });
    return Object.freeze(object);
}

// A wrapper function for Tauri's invoke method
export async function ipc_invoke(method, params = {}) {
    try {
        const response = await invoke(method, { params });
        if (response.error != null) {
            console.log('ERROR - ipc_invoke - ipc_invoke error', response);
            throw new Error(response.error);
        } else {
            return deepFreeze(response.result);
        }
    } catch (error) {
        console.error('ipc_invoke - Error calling method:', method, 'Error:', error);
        throw error;  // Rethrow the error for further handling
    }
}
