FROM --platform=linux/amd64 ubuntu:noble

RUN apt update && apt install -y \
    npm \
    nano \
    && rm -rf /var/lib/apt/lists/*

RUN apt-get -qq update; \
    apt-get install -y nodejs; \
    npm i -g npm@latest; \
    apt-get -y --purge autoremove; \
    apt-get clean; \
    rm -rf /var/lib/apt/lists/*;

RUN npm install -g node-gyp

WORKDIR /usr/src/app

COPY . .

RUN npm install

ENV LD_LIBRARY_PATH=/usr/src/app/lib:

# Expose the port that the application listens on.
EXPOSE 3000

# Run the application.
CMD node app.js
