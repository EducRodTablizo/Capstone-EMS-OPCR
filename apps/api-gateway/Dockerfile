FROM node:20-alpine AS builder
WORKDIR /app

# ── 1. Copy shared packages ────────────────────────────────────────────────────
COPY packages ./packages

# ── 2. Build @ems/types → compile TS to JS ────────────────────────────────────
WORKDIR /app/packages/types
# Minimal tsconfig for compiling the types package
RUN echo '{"compilerOptions":{"module":"CommonJS","target":"ES2021","outDir":"dist","rootDir":"src","declaration":true,"skipLibCheck":true,"experimentalDecorators":true,"emitDecoratorMetadata":true},"include":["src/**/*"]}' > tsconfig.json
RUN npm install typescript --no-save --legacy-peer-deps && npx tsc -p tsconfig.json
RUN echo '{"name":"@ems/types","version":"1.0.0","main":"dist/index.js","types":"dist/index.d.ts"}' > package.json

# ── 3. Build @ems/dto → compile TS to JS ──────────────────────────────────────
WORKDIR /app/packages/dto
RUN sed -i 's/"workspace:\*"/"*"/g' /app/packages/dto/package.json
RUN npm install --legacy-peer-deps
# Replace the @ems/types source ref with the compiled version for dto build
RUN sed -i 's|"@ems/types": \["../../packages/types/src/index.ts"\]|"@ems/types": ["../../packages/types/dist/index.d.ts"]|g' tsconfig.json 2>/dev/null || true
# Copy the compiled types into dto's node_modules so it can be imported
RUN mkdir -p node_modules/@ems && cp -r /app/packages/types node_modules/@ems/types
RUN echo '{"compilerOptions":{"module":"CommonJS","target":"ES2021","outDir":"dist","rootDir":"src","declaration":true,"skipLibCheck":true,"experimentalDecorators":true,"emitDecoratorMetadata":true},"include":["src/**/*"]}' > tsconfig.json
RUN npx tsc -p tsconfig.json || true
RUN echo '{"name":"@ems/dto","version":"1.0.0","main":"dist/index.js","types":"dist/index.d.ts","dependencies":{"class-validator":"^0.14.0","class-transformer":"^0.5.0"}}' > package.json

# ── 4. Install and build the service ──────────────────────────────────────────
WORKDIR /app/apps/api-gateway
COPY apps/api-gateway/package.json apps/api-gateway/tsconfig.json ./
RUN npm install --legacy-peer-deps
# Inject compiled @ems packages into service node_modules
RUN mkdir -p node_modules/@ems && \
    cp -r /app/packages/types node_modules/@ems/types && \
    cp -r /app/packages/dto node_modules/@ems/dto
COPY apps/api-gateway/src ./src
RUN npm run build

# ── Runtime stage ─────────────────────────────────────────────────────────────
FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/apps/api-gateway/dist ./dist
COPY --from=builder /app/apps/api-gateway/node_modules ./node_modules
# Ensure @ems packages are available at runtime
RUN mkdir -p node_modules/@ems
COPY --from=builder /app/packages/types ./node_modules/@ems/types
COPY --from=builder /app/packages/dto ./node_modules/@ems/dto
EXPOSE 3001
CMD ["node", "dist/apps/api-gateway/src/main.js"]

