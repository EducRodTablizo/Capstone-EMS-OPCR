FROM node:20-alpine AS builder
WORKDIR /app

COPY packages ./packages

WORKDIR /app/packages/types
RUN echo '{"compilerOptions":{"module":"CommonJS","target":"ES2021","outDir":"dist","rootDir":"src","declaration":true,"skipLibCheck":true,"experimentalDecorators":true,"emitDecoratorMetadata":true},"include":["src/**/*"]}' > tsconfig.json
RUN npm install typescript --no-save --legacy-peer-deps && npx tsc -p tsconfig.json
RUN echo '{"name":"@ems/types","version":"1.0.0","main":"dist/index.js","types":"dist/index.d.ts"}' > package.json

WORKDIR /app/packages/dto
RUN sed -i 's/"workspace:\*"/"*"/g' /app/packages/dto/package.json
RUN npm install --legacy-peer-deps
RUN mkdir -p node_modules/@ems && cp -r /app/packages/types node_modules/@ems/types
RUN echo '{"compilerOptions":{"module":"CommonJS","target":"ES2021","outDir":"dist","rootDir":"src","declaration":true,"skipLibCheck":true,"experimentalDecorators":true,"emitDecoratorMetadata":true},"include":["src/**/*"]}' > tsconfig.json
RUN npx tsc -p tsconfig.json || true
RUN echo '{"name":"@ems/dto","version":"1.0.0","main":"dist/index.js","types":"dist/index.d.ts","dependencies":{"class-validator":"^0.14.0","class-transformer":"^0.5.0"}}' > package.json

WORKDIR /app/apps/audit-log-service
COPY apps/audit-log-service/package.json apps/audit-log-service/tsconfig.json ./
RUN npm install --legacy-peer-deps
RUN mkdir -p node_modules/@ems && \
    cp -r /app/packages/types node_modules/@ems/types && \
    cp -r /app/packages/dto node_modules/@ems/dto
COPY apps/audit-log-service/src ./src
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/apps/audit-log-service/dist ./dist
COPY --from=builder /app/apps/audit-log-service/node_modules ./node_modules
RUN mkdir -p node_modules/@ems
COPY --from=builder /app/packages/types ./node_modules/@ems/types
COPY --from=builder /app/packages/dto ./node_modules/@ems/dto
EXPOSE 3006
CMD ["node", "dist/apps/audit-log-service/src/main.js"]

