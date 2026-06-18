---
title: API
---

/// warning | Breaking Changes

This API is not yet stable and may change in the future. The API is currently in development and is subject to change without notice.
///

You can use the API to interact with the application programmatically. The API is available at `/api` and supports GET and POST requests.

There is no full OpenAPI specification yet. Endpoint handlers live under `src/server/api/` (file-based routing).

## Authentication

Authenticate with **HTTP Basic Authentication** using the same username and password as the web UI.

If **2FA** is enabled for your account, Basic Auth requests fail. Disable 2FA or use a dedicated admin account without 2FA for automation.

### Authentication example

```python
import requests
from requests.auth import HTTPBasicAuth

url = "https://example.com:51821/api/client"
response = requests.get(
    url,
    auth=HTTPBasicAuth("username", "password"),
    params={"page": 1, "pageSize": 25, "sort": "asc"},
)
if response.status_code == 200:
    data = response.json()
    print(f"{len(data['clients'])} clients on page {data['page']} of {data['total']}")
else:
    print(f"Error: {response.status_code}")
```

## Clients

### `GET /api/client`

Returns a **paginated** list of clients with live WireGuard stats (handshake, transfer, endpoint).

**Query parameters:**

| Parameter  | Default  | Description                                |
| ---------- | -------- | ------------------------------------------ |
| `page`     | `1`      | Page number (1-based)                      |
| `pageSize` | `25`     | Clients per page (max `100`)               |
| `sort`     | `asc`    | Sort by name: `asc` or `desc`              |
| `filter`   | _(none)_ | Search name, IPv4, or IPv6 (partial match) |

**Response:**

```json
{
    "clients": [{ "id": 1, "name": "alice", "...": "..." }],
    "total": 105,
    "page": 1,
    "pageSize": 25
}
```

/// note
Metrics endpoints (`/metrics/json`, `/metrics/prometheus`) still return **all** clients and do not use this pagination format.
///

### `POST /api/client`

Create a client.

**Body (JSON):**

| Field               | Required | Description                              |
| ------------------- | -------- | ---------------------------------------- |
| `name`              | yes      | Unique client name (case-insensitive)    |
| `expiresAt`         | no       | ISO date string, or `null` for permanent |
| `trafficLimitBytes` | no       | Lifetime cap in bytes, or omit/`null`    |

**Success:** `200` with `{ "success": true, "clientId": 42 }`

**Duplicate name:** `409 Conflict` with message key `zod.client.nameTaken`

```shell
curl -u admin:PASSWORD -X POST https://example.com:51821/api/client \
  -H 'Content-Type: application/json' \
  -d '{"name":"k3m9x2","expiresAt":null}'
```

### Other client routes

| Method | Path                            | Description            |
| ------ | ------------------------------- | ---------------------- |
| GET    | `/api/client/:id`               | Client details         |
| POST   | `/api/client/:id`               | Update client          |
| DELETE | `/api/client/:id`               | Delete client          |
| GET    | `/api/client/:id/configuration` | Download `.conf`       |
| POST   | `/api/client/:id/enable`        | Enable client          |
| POST   | `/api/client/:id/disable`       | Disable client         |
| POST   | `/api/client/:id/reset-traffic` | Reset traffic counters |

## Admin

| Method | Path                        | Description                                                                   |
| ------ | --------------------------- | ----------------------------------------------------------------------------- |
| POST   | `/api/admin/interface/cidr` | Change IPv4/IPv6 CIDR (see [Admin Panel](../guides/admin.md#ipv4--ipv6-cidr)) |

**Change CIDR body:**

```json
{
    "ipv4Cidr": "10.8.0.0/20",
    "ipv6Cidr": "fdcc:ad94:bacf:61a4::cafe:0/112"
}
```

## Endpoint discovery

Other routes follow the same file-based convention, for example:

| File                                  | Endpoint       | Method |
| ------------------------------------- | -------------- | ------ |
| `src/server/api/client/index.get.ts`  | `/api/client`  | GET    |
| `src/server/api/client/index.post.ts` | `/api/client`  | POST   |
| `src/server/api/setup/2.post.ts`      | `/api/setup/2` | POST   |
