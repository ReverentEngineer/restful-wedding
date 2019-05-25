FROM node:alpine
LABEL maintainer="jeff@reverentengineer.com"
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
ADD . .
EXPOSE 3000
CMD [ "npm", "start" ]
