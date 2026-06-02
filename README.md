# wg

WireGuard VPN with a web admin UI — fork of [wg-easy/wg-easy](https://github.com/wg-easy/wg-easy) with **per-client lifetime traffic limits**.

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
docker build -t wg .
# or
pnpm build
```

### Run with Docker Compose (recommended)

```shell
docker compose up -d --build
# or
pnpm up
```

- **WireGuard UDP:** `51820`
- **Web UI:** `http://<host>:51821`
- **Config volume:** `etc_wireguard` → `/etc/wireguard`

Stop:

```shell
docker compose down
# or
pnpm down
```

### Run with `docker run`

```shell
docker run -d \
  --name wg \
  --cap-add NET_ADMIN \
  --cap-add SYS_MODULE \
  --sysctl net.ipv4.ip_forward=1 \
  --sysctl net.ipv4.conf.all.src_valid_mark=1 \
  -v wg-data:/etc/wireguard \
  -v /lib/modules:/lib/modules:ro \
  -p 51820:51820/udp \
  -p 51821:51821/tcp \
  --restart unless-stopped \
  wg
```

Replace `wg` with another tag if you built with `-t myregistry/wg:15`.

## Development

```shell
pnpm dev      # dev container (Dockerfile.dev)
pnpm cli:dev  # CLI in dev container
```

## License

AGPL-3.0-only — see [LICENSE](LICENSE).

This project is not affiliated with Jason A. Donenfeld, ZX2C4, or Edge Security. "WireGuard" and the WireGuard logo are registered trademarks of Jason A. Donenfeld.
