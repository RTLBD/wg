<template>
  <button
    type="button"
    class="inline-block rounded bg-gray-100 p-2 align-middle transition hover:bg-red-800 hover:text-white disabled:opacity-50 dark:bg-neutral-600 dark:text-neutral-300 dark:hover:bg-red-800 dark:hover:text-white"
    :disabled="creating"
    :title="$t('client.otlDesc')"
    @click="createLinkInBackground"
  >
    <IconsLink class="w-5" :class="{ 'animate-pulse': creating }" />
  </button>
</template>

<script setup lang="ts">
import { copyOneTimeLink, getOneTimeLinkUrl } from '~/utils/oneTimeLink';

const props = defineProps<{ client: LocalClient }>();

const clientsStore = useClientsStore();
const toast = useToast();
const { t } = useI18n();

const creating = ref(false);

async function createLinkInBackground() {
  if (creating.value) {
    return;
  }

  creating.value = true;

  try {
    const link = await $fetch<{
      oneTimeLink: string;
      expiresAt: string;
    }>(`/api/client/${props.client.id}/generateOneTimeLink`, {
      method: 'post',
      body: { durationMinutes: 60 },
    });

    await clientsStore.refresh();

    const url = getOneTimeLinkUrl(link.oneTimeLink);
    const copied = await copyOneTimeLink(url);

    toast.showToast({
      type: 'success',
      message: copied ? t('client.otlCopied') : t('client.otlCreated'),
    });
  } catch (e) {
    const message =
      e instanceof Error ? e.message : t('client.otlCreateFailed');
    toast.showToast({
      type: 'error',
      message,
    });
  } finally {
    creating.value = false;
  }
}
</script>
