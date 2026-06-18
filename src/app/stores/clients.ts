import { defineStore } from 'pinia';
import { sha256 } from 'js-sha256';

type ClientOneTimeLink = {
  oneTimeLink: string;
  expiresAt: string;
};

type ClientListItem = {
  id: number;
  name: string;
  enabled: boolean;
  createdAt: string;
  expiresAt: string | null;
  ipv4Address: string;
  ipv6Address: string;
  publicKey: string;
  latestHandshakeAt: string | null;
  endpoint: string | null;
  transferRx: number | null;
  transferTx: number | null;
  trafficLimitBytes: number | null;
  trafficUsedBytes: number;
  oneTimeLink: ClientOneTimeLink | null;
};

type ClientListResponse = {
  clients: ClientListItem[];
  total: number;
  page: number;
  pageSize: number;
};

export type LocalClient = ClientListItem & {
  avatar?: string;
  transferMax?: number;
} & Omit<ClientPersist, 'transferRxPrevious' | 'transferTxPrevious'>;

export type ClientPersist = {
  transferRxHistory: number[];
  transferRxPrevious: number;
  transferRxCurrent: number;
  transferRxSeries: { name: string; data: number[] }[];
  hoverRx?: unknown;
  transferTxHistory: number[];
  transferTxPrevious: number;
  transferTxCurrent: number;
  transferTxSeries: { name: string; data: number[] }[];
  hoverTx?: unknown;
};

const DEFAULT_PAGE_SIZE = 25;

export const useClientsStore = defineStore('Clients', () => {
  const globalStore = useGlobalStore();
  const clients = ref<null | LocalClient[]>(null);
  const clientsPersist = ref<Record<string, ClientPersist>>({});
  const filter = ref<string | undefined>(undefined);
  const page = ref(1);
  const pageSize = ref(DEFAULT_PAGE_SIZE);
  const total = ref(0);

  const listParams = computed(() => ({
    filter: filter.value,
    page: page.value,
    pageSize: pageSize.value,
    sort: globalStore.sortClient ? ('asc' as const) : ('desc' as const),
  }));

  const totalPages = computed(() =>
    Math.max(1, Math.ceil(total.value / pageSize.value))
  );

  const { data: _clients, refresh: _refresh } = useFetch<ClientListResponse>(
    '/api/client',
    {
      method: 'get',
      params: listParams,
    }
  );

  async function refresh({ updateCharts = false } = {}) {
    await _refresh();

    const payload = _clients.value;

    total.value = payload?.total ?? 0;
    page.value = payload?.page ?? page.value;
    pageSize.value = payload?.pageSize ?? pageSize.value;

    let transformedClients = payload?.clients?.map((client) => {
      let avatar = undefined;
      if (client.name.includes('@') && client.name.includes('.')) {
        avatar = `https://gravatar.com/avatar/${sha256(client.name.toLowerCase().trim())}.jpg`;
      }

      if (!clientsPersist.value[client.id]) {
        clientsPersist.value[client.id] = {
          transferRxHistory: Array(50).fill(0),
          transferRxPrevious: client.transferRx ?? 0,
          transferTxHistory: Array(50).fill(0),
          transferTxPrevious: client.transferTx ?? 0,
          transferRxCurrent: 0,
          transferTxCurrent: 0,
          transferRxSeries: [],
          transferTxSeries: [],
        };
      }

      const clientPersist = clientsPersist.value[client.id]!;

      clientPersist.transferRxCurrent =
        (client.transferRx ?? 0) - clientPersist.transferRxPrevious;

      clientPersist.transferRxPrevious = client.transferRx ?? 0;

      clientPersist.transferTxCurrent =
        (client.transferTx ?? 0) - clientPersist.transferTxPrevious;

      clientPersist.transferTxPrevious = client.transferTx ?? 0;

      let transferMax = undefined;

      if (updateCharts) {
        clientPersist.transferRxHistory.push(clientPersist.transferRxCurrent);
        clientPersist.transferRxHistory.shift();

        clientPersist.transferTxHistory.push(clientPersist.transferTxCurrent);
        clientPersist.transferTxHistory.shift();

        clientPersist.transferTxSeries = [
          {
            name: 'Tx',
            data: clientPersist.transferTxHistory,
          },
        ];

        clientPersist.transferRxSeries = [
          {
            name: 'Rx',
            data: clientPersist.transferRxHistory,
          },
        ];

        transferMax = Math.max(
          ...clientPersist.transferTxHistory,
          ...clientPersist.transferRxHistory
        );
      }

      return {
        ...client,
        avatar,
        transferTxHistory: clientPersist.transferTxHistory,
        transferRxHistory: clientPersist.transferRxHistory,
        transferMax,
        transferTxSeries: clientPersist.transferTxSeries,
        transferRxSeries: clientPersist.transferRxSeries,
        transferTxCurrent: clientPersist.transferTxCurrent,
        transferRxCurrent: clientPersist.transferRxCurrent,
        hoverTx: clientPersist.hoverTx,
        hoverRx: clientPersist.hoverRx,
      };
    });

    if (transformedClients !== undefined) {
      const activeIds = new Set(transformedClients.map((c) => String(c.id)));
      clientsPersist.value = Object.fromEntries(
        Object.entries(clientsPersist.value).filter(([id]) => activeIds.has(id))
      );
    }

    clients.value = transformedClients ?? null;
  }

  function setSearchQuery(value: string) {
    clients.value = null;
    filter.value = value || undefined;
    page.value = 1;
  }

  function setPage(nextPage: number) {
    const clamped = Math.min(Math.max(1, nextPage), totalPages.value);
    if (clamped === page.value) {
      return;
    }
    clients.value = null;
    page.value = clamped;
  }

  return {
    clients,
    clientsPersist,
    refresh,
    _clients,
    setSearchQuery,
    setPage,
    page,
    pageSize,
    total,
    totalPages,
  };
});
