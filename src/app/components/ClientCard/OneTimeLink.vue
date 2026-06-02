<template>
  <div v-if="client.oneTimeLink !== null" class="text-xs">
    <button
      type="button"
      class="max-w-full truncate text-left text-sky-600 underline decoration-dotted underline-offset-2 transition hover:text-sky-800 dark:text-sky-400 dark:hover:text-sky-300"
      :title="$t('client.otlClickToCopy')"
      @click="copyDisplayedLink"
    >
      {{ label }}
    </button>
    <span
      v-if="copied"
      class="ml-1 font-medium text-green-600 dark:text-green-400"
    >
      {{ $t('client.otlCopiedShort') }}
    </span>
  </div>
</template>

<script setup lang="ts">
import {
  copyOneTimeLink,
  formatOneTimeLinkTimeLeft,
  getOneTimeLinkUrl,
} from '~/utils/oneTimeLink';

const props = defineProps<{ client: LocalClient }>();

const { t } = useI18n();
const toast = useToast();

const label = ref('');
const copied = ref(false);
const timer = ref<ReturnType<typeof setInterval> | null>(null);
let copiedTimeout: ReturnType<typeof setTimeout> | null = null;

const fullUrl = computed(() => {
  if (props.client.oneTimeLink === null) {
    return '';
  }
  return getOneTimeLinkUrl(props.client.oneTimeLink.oneTimeLink);
});

function updateLabel() {
  if (props.client.oneTimeLink === null) {
    return;
  }

  const timeLeft =
    new Date(props.client.oneTimeLink.expiresAt).getTime() - Date.now();
  const remaining = formatOneTimeLinkTimeLeft(timeLeft);

  label.value = `${fullUrl.value} (${remaining})`;
}

async function copyDisplayedLink() {
  if (!fullUrl.value) {
    return;
  }

  const ok = await copyOneTimeLink(fullUrl.value);
  if (ok) {
    copied.value = true;
    if (copiedTimeout) {
      clearTimeout(copiedTimeout);
    }
    copiedTimeout = setTimeout(() => {
      copied.value = false;
    }, 2000);
  } else {
    toast.showToast({
      type: 'error',
      message: t('client.otlCopyFailed'),
    });
  }
}

onMounted(() => {
  updateLabel();
  timer.value = setInterval(updateLabel, 1000);
});

onUnmounted(() => {
  if (timer.value) {
    clearInterval(timer.value);
  }
  if (copiedTimeout) {
    clearTimeout(copiedTimeout);
  }
});
</script>
