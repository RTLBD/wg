# wg

WireGuard VPN with a web admin UI — fork of [wg-easy/wg-easy](https://github.com/wg-easy/wg-easy) with **per-client lifetime traffic limits**.

**Repository:** [https://github.com/RTLBD/wg](https://github.com/RTLBD/wg)

## Fork additions

- Set a **traffic limit (GB)** per client in create/edit UI
- Server tracks cumulative Rx+Tx usage (persisted across wg counter resets)
- Client is **auto-disabled** when the limit is reached
- **Reset traffic usage** button on client edit page

Upstream docs (reference): [https://wg-easy.github.io/wg-easy/latest](https://wg-easy.github.io/wg-easy/latest)

## Docker image: `wg`

Build and run your own image from the repo `Dockerfile`, or pull a published image from Docker Hub.

### CI publish (GitHub Actions)

The **Publish Docker image** workflow pushes a **multi-arch** image (`linux/amd64`, `linux/arm64`) to Docker Hub only when:

- You run it manually (**Actions → Publish Docker image → Run workflow**), or
- You publish a **GitHub Release** (tags the image with the release version and `latest`).

| Platform | Typical use |
|----------|-------------|
| `linux/amd64` | Linux VPS, Intel/AMD Mac or PC with Docker Desktop |
| `linux/arm64` | Raspberry Pi, ARM cloud, Apple Silicon Mac with Docker Desktop |

`docker pull` picks the right architecture automatically. The image is a **Linux** VPN server (runs in Docker on Linux, or inside Docker Desktop’s Linux VM on macOS and Windows — not a native Windows container).

- **Docker Hub:** `docker.io/<DOCKERHUB_USERNAME>/wg:latest` and `docker.io/<DOCKERHUB_USERNAME>/wg:<version>` (e.g. `15.3.0` from tag `v15.3.0`)

Add these **repository secrets** in GitHub → Settings → Secrets → Actions:

| Secret | Value |
|--------|--------|
| `DOCKERHUB_USERNAME` | Your Docker Hub username |
| `DOCKERHUB_PASSWORD` | Docker Hub [access token](https://hub.docker.com/settings/security) (not your account password) |

### Build

```shell
docker build -t imzami/wg:latest .
# or
make build
```

### Run with Docker Compose (recommended)

The stack uses **PostgreSQL** and pulls **`imzami/wg`** from Docker Hub.

```shell
cp .env.example .env   # set POSTGRES_PASSWORD
docker compose pull
docker compose up -d
# or
make up
```

- **WireGuard UDP:** `51820`
- **Web UI:** `https://<host>:51821` (or HTTP only if you set `INSECURE=true` behind a reverse proxy)
- **Config volume:** `etc_wireguard` → `/etc/wireguard`
- **Database:** `postgres` service (`pgdata` volume)

Upgrading from SQLite-backed releases: place the legacy `wg-easy.db` on the WireGuard volume; it is imported automatically on first startup. See [docs/content/advanced/migrate/from-sqlite-to-postgresql.md](docs/content/advanced/migrate/from-sqlite-to-postgresql.md).

Stop:

```shell
docker compose down
# or
pnpm down
```

### Run with `docker run`

Pull the image (use a release tag instead of `latest` if you prefer, e.g. `imzami/wg:15.3.0`):

```shell
docker pull imzami/wg:latest
```

Run the container (requires an external PostgreSQL instance and `DATABASE_URL`):

```shell
docker run -d \
  --name wg \
  --cap-add NET_ADMIN \
  --cap-add SYS_MODULE \
  --sysctl net.ipv4.ip_forward=1 \
  --sysctl net.ipv4.conf.all.src_valid_mark=1 \
  --sysctl net.ipv6.conf.all.disable_ipv6=0 \
  --sysctl net.ipv6.conf.all.forwarding=1 \
  --sysctl net.ipv6.conf.default.forwarding=1 \
  -v wg-data:/etc/wireguard \
  -v /lib/modules:/lib/modules:ro \
  -p 51820:51820/udp \
  -p 51821:51821/tcp \
  -e TZ=Asia/Dhaka \
  -e DATABASE_URL=postgresql://user:password@postgres-host:5432/wgeasy \
  --restart unless-stopped \
  imzami/wg:latest
```

- **Web UI:** serve over HTTPS (reverse proxy) or set `-e INSECURE=true` only for plain HTTP access

To build and push your own image: `docker build -t imzami/wg:latest .` then `docker push imzami/wg:latest`, or use **Actions → Publish Docker image**.

## License

AGPL-3.0-only — see [LICENSE](LICENSE).

This project is not affiliated with Jason A. Donenfeld, ZX2C4, or Edge Security. "WireGuard" and the WireGuard logo are registered trademarks of Jason A. Donenfeld.
