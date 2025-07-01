FROM node:18
WORKDIR /usr/src/app
COPY package.json ./
RUN npm install --production
COPY . .
CMD ["node", "chucknorris-mcp-server.js"]
