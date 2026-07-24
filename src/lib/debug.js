const DEBUG = import.meta.env.VITE_DEBUG === "true"

export function debugLog(...args) {
    if (DEBUG) {
        console.log(...args)
    }
}

export function debugError(...args) {
    if (DEBUG) {
        console.error(...args)
    }
}