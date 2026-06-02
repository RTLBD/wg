FROM docker.io/library/node:krypton-alpine AS build
WORKDIR /app

# update corepack
RUN npm install --global corepack@latest
# Install pnpm
RUN corepack enable pnpm

# Copy Web UI
COPY src/package.json src/pnpm-lock.yaml src/pnpm-workspace.yaml ./
RUN pnpm install

# Build UI
COPY src ./
RUN pnpm build

# Build amneziawg-tools and wireguard-go (patched x/crypto + x/net; Alpine wireguard-go is outdated)
RUN apk add linux-headers build-base go git && \
    git clone --depth 1 https://github.com/zamibd/amneziawg-tools.git && \
    git clone --depth 1 https://github.com/zamibd/amneziawg-go && \
    cd amneziawg-go && \
    GOTOOLCHAIN=auto make && \
    cd /app && \
    git clone --depth 1 https://github.com/WireGuard/wireguard-go.git && \
    cd wireguard-go && \
    GOTOOLCHAIN=auto go get golang.org/x/crypto@v0.52.0 golang.org/x/net@v0.55.0 golang.org/x/sys@v0.45.0 && \
    GOTOOLCHAIN=auto go mod tidy && \
    GOTOOLCHAIN=auto make && \
    cd /app/amneziawg-tools/src && \
    make && \
    sed -i 's|\[\[ $proto == -4 \]\] && cmd sysctl -q net\.ipv4\.conf\.all\.src_valid_mark=1|[[ $proto == -4 ]] \&\& [[ $(sysctl -n net.ipv4.conf.all.src_valid_mark) != 1 ]] \&\& cmd sysctl -q net.ipv4.conf.all.src_valid_mark=1|' ./wg-quick/linux.bash

FROM docker.io/library/node:krypton-alpine AS build-libsql
WORKDIR /app
RUN npm install --no-save --omit=dev libsql

# Copy build result to a new image.
# This saves a lot of disk space.
FROM docker.io/library/node:krypton-alpine
WORKDIR /app

HEALTHCHECK --interval=1m --timeout=5s --retries=3 CMD /usr/bin/timeout 5s /bin/sh -c "/usr/bin/wg show | /bin/grep -q interface || exit 1"

# Copy build
COPY --from=build /app/.output /app
# Copy migrations
COPY --from=build /app/server/database/migrations /app/server/database/migrations
# libsql (https://github.com/nitrojs/nitro/issues/3328)
COPY --from=build-libsql /app/node_modules /app/server/node_modules

# cli
COPY --from=build /app/cli/cli.sh /usr/local/bin/cli
RUN chmod +x /usr/local/bin/cli
# Copy amneziawg-go and patched wireguard-go (userspace fallback for wg-quick)
COPY --from=build /app/amneziawg-go/amneziawg-go /usr/bin/amneziawg-go
COPY --from=build /app/wireguard-go/wireguard-go /usr/bin/wireguard-go
RUN chmod +x /usr/bin/amneziawg-go /usr/bin/wireguard-go
# Copy amneziawg-tools
COPY --from=build /app/amneziawg-tools/src/wg /usr/bin/awg
COPY --from=build /app/amneziawg-tools/src/wg-quick/linux.bash /usr/bin/awg-quick
RUN chmod +x /usr/bin/awg /usr/bin/awg-quick

# Install Linux packages (wireguard-go is built above; do not install vulnerable apk package)
RUN apk add --no-cache \
    dumb-init \
    iptables \
    ip6tables \
    nftables \
    kmod \
    iptables-legacy \
    wireguard-tools && \
    apk upgrade --no-cache && \
    sed -i 's|\[\[ $proto == -4 \]\] && cmd sysctl -q net\.ipv4\.conf\.all\.src_valid_mark=1|[[ $proto == -4 ]] \&\& [[ $(sysctl -n net.ipv4.conf.all.src_valid_mark) != 1 ]] \&\& cmd sysctl -q net.ipv4.conf.all.src_valid_mark=1|' /usr/bin/wg-quick

RUN mkdir -p /etc/amnezia
RUN ln -s /etc/wireguard /etc/amnezia/amneziawg

# Use iptables-legacy (symlinks avoid dpkg/update-alternatives, which pulls vulnerable tar)
RUN ln -sf /usr/sbin/iptables-legacy /usr/sbin/iptables && \
    ln -sf /usr/sbin/iptables-legacy-restore /usr/sbin/iptables-restore && \
    ln -sf /usr/sbin/iptables-legacy-save /usr/sbin/iptables-save && \
    ln -sf /usr/sbin/ip6tables-legacy /usr/sbin/ip6tables && \
    ln -sf /usr/sbin/ip6tables-legacy-restore /usr/sbin/ip6tables-restore && \
    ln -sf /usr/sbin/ip6tables-legacy-save /usr/sbin/ip6tables-save

# Set Environment
ENV DEBUG=Server,WireGuard,Database,CMD,Firewall
ENV PORT=51821
ENV HOST=0.0.0.0
ENV INSECURE=false
ENV INIT_ENABLED=false
ENV DISABLE_IPV6=false

LABEL org.opencontainers.image.title=wg
LABEL org.opencontainers.image.source=https://github.com/RTLBD/wg-easy

# Run Web UI
CMD ["/usr/bin/dumb-init", "node", "server/index.mjs"]
