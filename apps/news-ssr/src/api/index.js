const {API} = require('axios-client');

const client = API();

if (client.server) {
    cacheSources();
}

function cacheSources() {
    fetchSources();
    setTimeout(cacheSources, 1000 * 60 * 10)
}

function fetch(url, params = null) {
    const cache = client.cachedItems;

    let key;

    if (params) {
        key = url + '_' + params.source;
    } else {
        key = url;
    }

    if (cache && cache.has(key)) {
        return Promise.resolve(cache.get(key));
    } else {
        return new Promise((resolve, reject) => {
            client.get(url, {
                params: params
            }).then((res) => {

                if (res.data.status === "ok") {
                    cache && cache.set(key, res.data);
                    resolve(res.data);
                } else {
                    reject("News API error: " + res.data.message);
                }

            }).catch(reject);
        });
    }
}

export function fetchSources() {
    return fetch('https://news-api-cache.s3.us-west-1.amazonaws.com/v1/sources');
}

export function fetchHeadlines(source) {
    return fetch(`https://news-api-cache.s3.us-west-1.amazonaws.com/v1/articles/${source}`);
}
