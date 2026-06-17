import { randomBytes } from 'node:crypto';

import type { DBType } from './postgres';
import { general, hooks, userConfig, wgInterface } from './schema';

const DEFAULT_POST_UP =
  'iptables -t nat -A POSTROUTING -s {{ipv4Cidr}} -o {{device}} -j MASQUERADE; iptables -A INPUT -p udp -m udp --dport {{port}} -j ACCEPT; iptables -A FORWARD -i wg0 -j ACCEPT; iptables -A FORWARD -o wg0 -j ACCEPT; ip6tables -t nat -A POSTROUTING -s {{ipv6Cidr}} -o {{device}} -j MASQUERADE; ip6tables -A INPUT -p udp -m udp --dport {{port}} -j ACCEPT; ip6tables -A FORWARD -i wg0 -j ACCEPT; ip6tables -A FORWARD -o wg0 -j ACCEPT;';

const DEFAULT_POST_DOWN =
  'iptables -t nat -D POSTROUTING -s {{ipv4Cidr}} -o {{device}} -j MASQUERADE; iptables -D INPUT -p udp -m udp --dport {{port}} -j ACCEPT; iptables -D FORWARD -i wg0 -j ACCEPT; iptables -D FORWARD -o wg0 -j ACCEPT; ip6tables -t nat -D POSTROUTING -s {{ipv6Cidr}} -o {{device}} -j MASQUERADE; ip6tables -D INPUT -p udp -m udp --dport {{port}} -j ACCEPT; ip6tables -D FORWARD -i wg0 -j ACCEPT; ip6tables -D FORWARD -o wg0 -j ACCEPT;';

export async function hasGeneralConfig(db: DBType) {
  const row = await db.query.general.findFirst({
    columns: { id: true },
  });
  return row !== undefined;
}

export async function seedInitialData(db: DBType) {
  await db.insert(general).values({
    setupStep: 1,
    sessionPassword: randomBytes(256).toString('hex'),
    sessionTimeout: 3600,
    metricsPrometheus: false,
    metricsJson: false,
  });

  await db.insert(wgInterface).values({
    name: 'wg0',
    device: 'eth0',
    port: 51820,
    privateKey: '---default---',
    publicKey: '---default---',
    ipv4Cidr: '10.8.0.0/24',
    ipv6Cidr: 'fdcc:ad94:bacf:61a4::cafe:0/112',
    mtu: 1420,
    enabled: true,
    firewallEnabled: false,
  });

  await db.insert(hooks).values({
    id: 'wg0',
    preUp: '',
    postUp: DEFAULT_POST_UP,
    preDown: '',
    postDown: DEFAULT_POST_DOWN,
  });

  await db.insert(userConfig).values({
    id: 'wg0',
    defaultMtu: 1420,
    defaultPersistentKeepalive: 0,
    defaultDns: ['1.1.1.1', '2606:4700:4700::1111'],
    defaultAllowedIps: ['0.0.0.0/0', '::/0'],
    host: '',
    port: 51820,
  });
}
