FROM node:alpine
ADD ./app .
RUN npm install .
CMD ["/bin/sh", "-c", "./bin/www"]
