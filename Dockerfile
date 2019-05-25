FROM node:alpine
ENV NODE_CONFIG '{"dbpath":"/var/lib/mail/mail.db"}'
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
COPY . .
VOLUME /var/lib/mail
EXPOSE 3000
CMD [ "npm", "start" ]
