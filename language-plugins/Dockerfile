# Stage 1: Base image for Node.js and Python
FROM node:20 as node_base
WORKDIR /usr/src/app
COPY javascript/package*.json ./
RUN npm install
COPY javascript/src/ ./src
COPY javascript/tests/ ./tests

FROM python:3.10 as python_base
WORKDIR /usr/src/app
COPY python/requirements.txt .
RUN pip install -r requirements.txt
COPY python/src/ ./src
COPY python/tests/ ./tests

# Stage 2: Combine Node.js and Python for the final image
FROM node:20
WORKDIR /usr/src/language-plugins

# Copy files from the Node.js and Python base images
COPY --from=node_base /usr/src/app /usr/src/language-plugins/javascript
COPY --from=python_base /usr/src/app /usr/src/language-plugins/python

# Copy the remaining source code and configuration files
COPY src/ ./src
COPY supervisord.conf /etc/supervisord.conf

# Install supervisor and Python
RUN apt-get update && apt-get install -y supervisor python3

CMD ["/usr/bin/supervisord"]
