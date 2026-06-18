<template>
  <div
    v-if="clientsStore.total > clientsStore.pageSize"
    class="flex flex-col gap-3 border-t border-gray-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between dark:border-neutral-600"
  >
    <p class="text-sm text-gray-600 dark:text-neutral-300">
      {{
        $t('client.paginationSummary', {
          from: rangeFrom,
          to: rangeTo,
          total: clientsStore.total,
        })
      }}
    </p>
    <div class="flex items-center gap-2">
      <BaseSecondaryButton
        type="button"
        :disabled="clientsStore.page <= 1"
        @click="clientsStore.setPage(clientsStore.page - 1)"
      >
        {{ $t('client.paginationPrevious') }}
      </BaseSecondaryButton>
      <span
        class="min-w-24 text-center text-sm text-gray-600 dark:text-neutral-300"
      >
        {{
          $t('client.paginationPage', {
            page: clientsStore.page,
            totalPages: clientsStore.totalPages,
          })
        }}
      </span>
      <BaseSecondaryButton
        type="button"
        :disabled="clientsStore.page >= clientsStore.totalPages"
        @click="clientsStore.setPage(clientsStore.page + 1)"
      >
        {{ $t('client.paginationNext') }}
      </BaseSecondaryButton>
    </div>
  </div>
</template>

<script setup lang="ts">
const clientsStore = useClientsStore();

const rangeFrom = computed(() =>
  clientsStore.total === 0
    ? 0
    : (clientsStore.page - 1) * clientsStore.pageSize + 1
);

const rangeTo = computed(() =>
  Math.min(clientsStore.page * clientsStore.pageSize, clientsStore.total)
);
</script>
