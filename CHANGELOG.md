# Changelog

All notable changes to **[RTLBD/wg](https://github.com/RTLBD/wg)** are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## Note

This file previously contained the full upstream [wg-easy/wg-easy](https://github.com/wg-easy/wg-easy) history. That history has been **cleared** so this changelog only tracks the **wg** fork.

- **Upstream project:** [wg-easy/wg-easy](https://github.com/wg-easy/wg-easy) (base version **15.3.0**)
- **Upstream changelog:** [wg-easy CHANGELOG](https://github.com/wg-easy/wg-easy/blob/master/CHANGELOG.md)
- **Fork repository:** [https://github.com/RTLBD/wg](https://github.com/RTLBD/wg)
- **Docker image:** `docker.io/imzami/wg` (`latest` and release tags)

---

## [Unreleased]

### Added

- Per-client **lifetime traffic limits** (auto-disable when exceeded, reset usage in UI)
- Rebrand to **wg** (UI, CLI banner, locales, Docker image/service name)
- **Makefile** helpers for Docker Compose (`make up`, `down`, `logs`, etc.)
- **Multi-arch** Docker images (`linux/amd64`, `linux/arm64`)
- Docker Hub publish via GitHub Actions (manual workflow or GitHub Release → version + `latest`)
- **One-time links:** 60-minute default TTL, background create, click-to-copy
- Default timezone **`Asia/Dhaka`** in Docker image and compose (`TZ` + `tzdata`)
- `README` `docker run` example for `imzami/wg` with `INSECURE=true` for local HTTP

### Changed

- Removed legacy **`Dockerfile.prebuilt`** and **`scripts/build-fork-image.sh`** (upstream image overlay); aligned **`Dockerfile.dev`** with production base (tzdata, iptables symlinks, no `dpkg`)
- Repository canonical URL: **https://github.com/RTLBD/wg**
- GitHub release/update checks point at `RTLBD/wg`
- CI: workflows target `main`; lint runs on fork; Edge workflow no longer deploys on push
- Docker: build **wireguard-go** and **amneziawg-go** from source with patched Go modules (CVE fixes)
- Docker: remove bundled **npm** from runtime image; upgrade **busybox** and global npm in build base
- Docker publish: **Docker Hub only** (GHCR job removed); no push on every `main` commit

### Fixed

- Critical image CVEs (Alpine **busybox**, npm **brace-expansion**, **ip-address** in bundled npm)
- Memory leaks: WireGuard cron timer, `clientsPersist` pruning, 2FA QR `objectURL` revoke
- ESLint `no-dynamic-delete` in client chart persist logic
- CI typecheck, Prettier, and ESLint failures for fork workflows

---

## [15.3.0] - 2026-06-02

Fork baseline aligned with upstream **wg-easy v15.3.0**. See upstream [15.3.0 release notes](https://github.com/wg-easy/wg-easy/releases) for features inherited from wg-easy.
