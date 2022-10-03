FROM node:latest
WORKDIR /app

COPY package.json /app/package.json
COPY package-lock.json /app/package-lock.json
RUN npm install
COPY . /app

VOLUME [ "/app/credentials" ]
VOLUME [ "/app/instances" ]
VOLUME [ "/app/logs" ]

CMD ["npm", "start"]
