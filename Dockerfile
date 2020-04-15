FROM node:12-alpine

EXPOSE 8240 8239 8238 8237 8236 8235

RUN apk --no-cache add --virtual builds-deps build-base python

ADD ./ /codebase
WORKDIR /codebase

RUN npm install --no-package-lock --no-progress --ignore-scripts
RUN npm run install-all
RUN npm run build:all

CMD ["node", "start_all.js"]
