---
title: Admin Panel
---

## Interface Settings

### Per-Client Firewall

Enable server-side firewall filtering to enforce network access restrictions per client.

When enabled, each client can have custom "Firewall Allowed IPs" configured that restrict which destinations they can access through the VPN. These restrictions are enforced by the server using iptables/ip6tables and cannot be bypassed by the client.

/// warning | Experimental Feature

This feature is currently experimental. While functional, it should be thoroughly tested in your environment before relying on it for production security requirements. Always verify that firewall rules are working as expected using test traffic or by manually inspecting the rules.

///

**Requirements:**

- `iptables` must be installed on the host system
- `ip6tables` must be installed if IPv6 is enabled (default)
- The feature cannot be enabled if these tools are not available

/// note
Most Linux distributions include iptables by default. If you're running in a minimal container environment, you may need to install the `iptables` package on the host system.
///

**Enable this feature if you want to:**

- Restrict certain clients to only access specific servers or networks
- Prevent clients from accessing the internet while allowing LAN access
- Enforce port-based restrictions (e.g., only allow HTTP/HTTPS)
- Separate routing configuration from security enforcement

**How it works:**

1. Enable "Per-Client Firewall" in Admin Panel → Interface
2. Edit any client to see the new "Firewall Allowed IPs" field
3. Specify allowed destinations (IPs, subnets, ports) for that client
4. Server enforces these rules automatically

See [Edit Client → Firewall Allowed IPs](./clients.md#firewall-allowed-ips) for detailed configuration syntax and examples.

## IPv4 / IPv6 CIDR

The interface CIDR defines the address pool used for client IPs.

| Default (new installs)                 | Approx. client capacity |
| -------------------------------------- | ----------------------- |
| IPv4 `10.8.0.0/20`                     | ~4,000                  |
| IPv6 `fdcc:ad94:bacf:61a4::cafe:0/112` | ~65,000                 |

/// warning | Changing CIDR

Use **Change CIDR** only when you need more addresses or a different subnet. Expanding the IPv4 range (for example from `/24` to `/20`) reassigns client IPs and requires clients to download updated configuration files.
///

**Expand the pool (example):**

```shell
curl -u admin:YOUR_PASSWORD -X POST https://vpn.example.com:51821/api/admin/interface/cidr \
  -H 'Content-Type: application/json' \
  -d '{
    "ipv4Cidr": "10.8.0.0/20",
    "ipv6Cidr": "fdcc:ad94:bacf:61a4::cafe:0/112"
  }'
```

Or use **Admin Panel → Interface → Change CIDR** in the web UI.
