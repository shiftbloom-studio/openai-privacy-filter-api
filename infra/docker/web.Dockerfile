FROM public.ecr.aws/docker/library/node:24-alpine AS deps

WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/web/package.json apps/web/package.json
RUN npm ci

FROM public.ecr.aws/docker/library/node:24-alpine AS builder

WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json ./
COPY apps/web ./apps/web

# Runtime selection is a build-time variable: Next.js inlines
# NEXT_PUBLIC_* into the client bundle.
ARG NEXT_PUBLIC_PRIVACY_FILTER_RUNTIME=browser
ENV NEXT_PUBLIC_PRIVACY_FILTER_RUNTIME=$NEXT_PUBLIC_PRIVACY_FILTER_RUNTIME
RUN npm --workspace apps/web run build

FROM public.ecr.aws/docker/library/node:24-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000

# The Shiftbloom deployment defaults to in-browser inference because no
# server-side inference compute is provisioned. Public users can build with
# --build-arg NEXT_PUBLIC_PRIVACY_FILTER_RUNTIME=server to target the FastAPI
# service instead.
ARG NEXT_PUBLIC_PRIVACY_FILTER_RUNTIME=browser
ENV NEXT_PUBLIC_PRIVACY_FILTER_RUNTIME=$NEXT_PUBLIC_PRIVACY_FILTER_RUNTIME

COPY --from=builder /app/package.json /app/package-lock.json ./
COPY --from=builder /app/apps/web/package.json ./apps/web/package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/web/.next ./apps/web/.next
COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder /app/apps/web/app ./apps/web/app
COPY --from=builder /app/apps/web/components ./apps/web/components
COPY --from=builder /app/apps/web/lib ./apps/web/lib
COPY --from=builder /app/apps/web/next.config.ts ./apps/web/next.config.ts

EXPOSE 3000
CMD ["npm", "--workspace", "apps/web", "run", "start"]
