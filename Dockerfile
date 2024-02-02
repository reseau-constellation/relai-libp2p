# Node serves as the runtime environment for JavaScript, hence we use it as our base image.
FROM node:20 AS base
RUN apk-get update && apk-get add --no-cache libc6-compat
RUN corepack enable && corepack prepare pnpm@8.7.6 --activate 

# We set /app as the working directory within the container
WORKDIR /app

# We copy package.json and package-lock.json into the /app directory in the container
COPY package*.json ./

# The dependencies are installed in the container
RUN pnpm install

# The rest of the code is copied into the container
COPY . .

# Port 3000 is exposed to enable access from outside
EXPOSE 3000

# The command required to run the app is specified
CMD [ "pnpm", "lancer" ]
