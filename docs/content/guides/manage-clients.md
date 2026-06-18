---
title: Manage Clients
---

## Client list

The home page shows all VPN clients with live transfer stats and quick actions.

- **Search**: Filter by client name or IP address. Results are paginated; search resets to page 1.
- **Sort**: Toggle name sort order (A→Z / Z→A). Sorting is applied on the server.
- **Pagination**: When there are more than 25 clients, use **Previous** / **Next** at the bottom of the list. Each page loads up to 25 clients.

/// note | Large deployments

For hundreds or thousands of clients, keep the default page size and use search to find a client quickly instead of scrolling through every page.
///

## Create a client

1. Click **New** on the client list page.
2. Enter a **Name** or click **Generate** to create a random 6-character name (`a-z`, `0-9`).
3. Optionally set **Expire Date** and **Traffic Limit (GB)**.
4. Click **Create Client**.

### Unique names

Client names must be **unique** (case-insensitive). Creating a client with a name that already exists returns an error.

The **Generate** button picks a random name that is not already used among clients loaded in the UI. If a generated name is taken, the server rejects the request and you can click **Generate** again.

## Traffic limits (fork)

When creating or editing a client you can set a **Traffic Limit (GB)**. The server tracks lifetime usage and disables the client when the limit is reached. See the edit page **Reset Traffic Usage** action to clear counters.
