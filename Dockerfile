FROM node:15.13.0-alpine3.10 as build

WORKDIR /app
COPY . .

RUN yarn && \
  yarn code:check && \
  yarn test && \
  yarn build

FROM node:15.13.0-alpine3.10
WORKDIR /app

COPY --from=build /app/build/src/ ./
COPY --from=build /app/node_modules/ ./node_modules/

ENV PORT 8022
ENV TIMEOUT 180000

EXPOSE 8022
ENTRYPOINT ["node"]
CMD [ "index.js" ]
