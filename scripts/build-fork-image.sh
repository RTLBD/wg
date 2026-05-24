#!/usr/bin/env bash
# Build fork image by layering prebuilt src/.output onto upstream wg-easy:15.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

: "${http_proxy:=http://127.0.0.1:2080}"
: "${https_proxy:=${http_proxy}}"
export http_proxy https_proxy

IMAGE="${WG_EASY_FORK_IMAGE:-ghcr.io/lamirshahinxl/wg-easy:15-traffic-limit}"

if [[ ! -d src/.output ]]; then
  echo "Building app bundle..."
  (cd src && pnpm install && pnpm build)
fi

if ! docker image inspect ghcr.io/wg-easy/wg-easy:15 >/dev/null 2>&1; then
  if [[ -f "$ROOT/../dnstt-vaydns-client/wg-easy-offline-bundle/pkgs/wg-easy-15.tar ]]; then
    docker load -i "$ROOT/../dnstt-vaydns-client/wg-easy-offline-bundle/pkgs/wg-easy-15.tar"
  else
    echo "Missing base image ghcr.io/wg-easy/wg-easy:15 — load or pull it first." >&2
    exit 1
  fi
fi

rm -rf docker-artifacts
mkdir -p docker-artifacts
cp -R src/.output docker-artifacts/.output
cp -R src/server/database/migrations docker-artifacts/migrations

docker build --platform linux/amd64 -f Dockerfile.prebuilt -t "$IMAGE" .

echo "Built $IMAGE"
