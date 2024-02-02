# Node serves as the runtime environment for JavaScript, hence we use it as our base image.
FROM node:20-alpine AS base
 
FROM base AS deps
 
RUN corepack enable
RUN apk update
RUN apk add g++
RUN apk add make
RUN apk add cmake

# We set /app as the working directory within the container
WORKDIR /app

# We copy package.json and package-lock.json into the /app directory in the container
COPY package.json pnpm-lock.yaml ./
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store pnpm fetch --frozen-lockfile
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store pnpm install --frozen-lockfile --prod
 
FROM base AS build

RUN corepack enable
WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store pnpm fetch --frozen-lockfile
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store pnpm install --frozen-lockfile

# The rest of the code is copied into the container
COPY . .

RUN pnpm install node-pre-gyp -g
RUN pnpm compiler

# Port 3000 is exposed to enable access from outside
EXPOSE 3000

FROM base
 
WORKDIR /app
COPY --from=deps /app/node_modules /app/node_modules
COPY --from=build /app/dist /app/dist
ENV NODE_ENV production

# The command required to run the app is specified
CMD [ "node", "--env-file=.env", "dist/serveur.js" ]
