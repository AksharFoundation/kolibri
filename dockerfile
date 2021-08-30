# using ubuntu LTS version
FROM ubuntu:bionic

ENV NODE_VERSION=10.17.0

# install required packages
RUN apt-get update && \
    DEBIAN_FRONTEND=noninteractive apt-get install -y \
    curl \
    software-properties-common \
    gettext \
    git \
    git-lfs \
    psmisc \
    python2.7 \
    python-pip \
    python-sphinx \
    net-tools


# add yarn ppa
RUN curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | apt-key add -
RUN echo "deb https://dl.yarnpkg.com/debian/ stable main" | tee /etc/apt/sources.list.d/yarn.list

# install nodejs and yarn
RUN apt-get update && \
    curl -sSO https://deb.nodesource.com/node_10.x/pool/main/n/nodejs/nodejs_$NODE_VERSION-1nodesource1_amd64.deb && \
    dpkg -i ./nodejs_$NODE_VERSION-1nodesource1_amd64.deb && \
    rm nodejs_$NODE_VERSION-1nodesource1_amd64.deb && \
    apt-get install yarn

RUN git lfs install

COPY docker/entrypoint.py /docker/entrypoint.py

# copy Kolibri source code into image
COPY . /kolibri

# install project dependencies
RUN cd /kolibri && \
    yarn install

# do the time-consuming base install commands
RUN cd /kolibri \
    && pip install -r requirements.txt 

ENV KOLIBRI_RUN_MODE=dev
ENV KOLIBRI_PROVISIONDEVICE_FACILITY="Akshar Dev"
# yarn devserver port is hardcoded to 8000 so this var is only for info purposes
ENV KOLIBRI_HTTP_PORT=8080

WORKDIR /kolibri

# Install kolibri from source
RUN cd /kolibri \
    && pip install -e .

RUN cd /kolibri \
    && yarn run build

EXPOSE 8000 8080

CMD ["kolibri", "start", "--foreground"]