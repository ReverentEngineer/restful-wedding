FROM node:alpine
LABEL maintainer="jeff@reverentengineer.com"
ENV NODE_ENV production
ADD ./app .
RUN npm install .
CMD ["/bin/sh", "-c", "./bin/www"]
