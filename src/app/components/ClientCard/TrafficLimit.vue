<template>
  <span
    v-if="client.trafficLimitBytes"
    class="text-xs text-gray-500 dark:text-neutral-400"
  >
    <span
      :class="{
        'text-red-600 dark:text-red-400': limitReached,
      }"
    >
      {{ bytes(client.trafficUsedBytes ?? 0) }} /
      {{ bytes(client.trafficLimitBytes) }}
    </span>
    <span
      v-if="limitReached"
      class="ml-1 font-medium text-red-600 dark:text-red-400"
    >
      ({{ $t('client.trafficLimitReached') }})
    </span>
  </span>
</template>

<script setup lang="ts">
import { bytes } from '~/utils/math';
import { isTrafficLimitReached } from '~/utils/trafficLimit';

const props = defineProps<{
  client: LocalClient;
}>();

const limitReached = computed(() =>
  isTrafficLimitReached(
    props.client.trafficUsedBytes,
    props.client.trafficLimitBytes,
    props.client.enabled
  )
);
</script>
