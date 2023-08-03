FROM node:18

RUN apt-get update && apt-get install -y graphicsmagick && apt-get clean

WORKDIR /app

COPY . /app

VOLUME [ "/app/credentials" ]
VOLUME [ "/app/instances" ]
VOLUME [ "/app/logs" ]

CMD ["npm", "start"]
