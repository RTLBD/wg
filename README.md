# wg

WireGuard VPN with a web admin UI — fork of [wg-easy/wg-easy](https://github.com/wg-easy/wg-easy) with **per-client lifetime traffic limits**.

## Fork additions

- Set a **traffic limit (GB)** per client in create/edit UI
- Server tracks cumulative Rx+Tx usage (persisted across wg counter resets)
- Client is **auto-disabled** when the limit is reached
- **Reset traffic usage** button on client edit page

Upstream docs (reference): [https://wg-easy.github.io/wg-easy/latest](https://wg-easy.github.io/wg-easy/latest)

## Docker image: `wg`

Build and run your own image from the repo `Dockerfile`, or pull a CI-built image from Docker Hub / GHCR.

### CI publish (GitHub Actions)

On push to `main`, the workflow builds and pushes:

- **Docker Hub:** `docker.io/<DOCKERHUB_USERNAME>/wg:latest`
- **GHCR:** `ghcr.io/rtlbd/wg:latest` (optional; may require package permissions)

Add these **repository secrets** in GitHub → Settings → Secrets → Actions:

| Secret | Value |
|--------|--------|
| `DOCKERHUB_USERNAME` | Your Docker Hub username |
| `DOCKERHUB_PASSWORD` | Docker Hub [access token](https://hub.docker.com/settings/security) (not your account password) |

Ensure **Settings → Actions → General → Workflow permissions** is set to **Read and write** so `GITHUB_TOKEN` can publish to GHCR.

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
