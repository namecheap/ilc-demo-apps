![Demo apps logo](brand/cover_small.png)

----

This repository contains demo Micro Frontends for 
[Isomorphic Layout Composer (ILC)](https://github.com/namecheap/ilc).
Please check out the [original ILC repository](https://github.com/namecheap/ilc) for more information about it.

## List of the demo Micro Frontends
### Applications
1. [System](./apps/system) (written in vanilla JS, with SSR)
1. [News](./apps/news-ssr) (written in Vue.js, with SSR)
1. [Navigation](./apps/navbar) (written in React, with SSR)
1. [People](./apps/people) (written in React, no SSR)
1. [Planets](./apps/planets) (written in Vue.js, no SSR)

### Services
1. [fetchWithCache](./apps/fetchWithCache) (used by News & People)


## Quick start

1. Clone the repo
1. Run `docker-compose up`
1. Open 127.0.0.1 at respective ports to see apps running.

## Development process

1. Clone the repo
1. Run `npm install`
1. Run `npm start`
1. Open 127.0.0.1 at respective ports to see apps running.
