FROM node:12-alpine

EXPOSE 8240 8239 8238 8237 8236 8235 8234

RUN apk --no-cache add --virtual builds-deps build-base python

ADD ./ /codebase
WORKDIR /codebase

ENV PUBLIC_HOST=localhost

RUN npm install --no-package-lock --no-progress --ignore-scripts
RUN npm run install-all
RUN npm run build:all

ARG VCS_REF
LABEL org.label-schema.schema-version="1.0" \
      org.label-schema.vcs-ref=$VCS_REF \
      org.label-schema.vcs-url="https://github.com/namecheap/ilc-demo-apps" \
      org.opencontainers.image.source="https://github.com/namecheap/ilc-demo-apps" \
      org.opencontainers.image.revision=$VCS_REF

CMD ["node", "start_all.js"]
