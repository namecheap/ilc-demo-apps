import fetchWithCache from '@portal/fetchWithCache';
import { Observable, of } from 'rxjs';

// Answers fetchWithCache(url) from `responses`: a plain value is emitted (and the observable completes),
// a function is called to get the observable to return
export function respondWith(responses) {
    fetchWithCache.mockImplementation((url) => {
        if (!Object.prototype.hasOwnProperty.call(responses, url)) {
            throw new Error(`Unexpected request: ${url}`);
        }
        const response = responses[url];
        return typeof response === 'function' ? response() : of(response);
    });
}

// An observable that never emits; `unsubscribed` tells whether its subscriber went away
export function pending() {
    const state = { unsubscribed: 0 };
    state.observable = new Observable(() => () => {
        state.unsubscribed += 1;
    });
    return state;
}

export const requestedUrls = () => fetchWithCache.mock.calls.map(([url]) => url);
