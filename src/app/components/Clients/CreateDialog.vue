<template>
  <BaseDialog :trigger-class="triggerClass">
    <template #trigger>
      <slot />
    </template>
    <template #title>
      {{ $t('client.new') }}
    </template>
    <template #description>
      <div class="flex flex-col">
        <FormTextField id="name" v-model="name" :label="$t('client.name')" />
        <FormDateField
          id="expiresAt"
          v-model="expiresAt"
          :label="$t('client.expireDate')"
        />
        <FormTextField
          id="trafficLimitGb"
          v-model="trafficLimitGb"
          :label="$t('client.trafficLimit')"
          :description="$t('client.trafficLimitDesc')"
        />
      </div>
    </template>
    <template #actions>
      <DialogClose as-child>
        <BaseSecondaryButton>{{ $t('dialog.cancel') }}</BaseSecondaryButton>
      </DialogClose>
      <DialogClose as-child>
        <BasePrimaryButton @click="createClient">
          {{ $t('client.create') }}
        </BasePrimaryButton>
      </DialogClose>
    </template>
  </BaseDialog>
</template>

<script lang="ts" setup>
const name = ref<string>('');
const expiresAt = ref<string | null>(null);
const trafficLimitGb = ref<string>('');
const clientsStore = useClientsStore();

const { t } = useI18n();

defineProps<{ triggerClass?: string }>();

function createClient() {
  const limitGb = trafficLimitGb.value.trim();
  const trafficLimitBytes =
    limitGb !== '' && !Number.isNaN(Number(limitGb)) && Number(limitGb) > 0
      ? gbToBytes(Number(limitGb))
      : null;

  return _createClient({
    name: name.value,
    expiresAt: expiresAt.value,
    trafficLimitBytes,
  });
}

const _createClient = useSubmit(
  '/api/client',
  {
    method: 'post',
  },
  {
    revert: () => clientsStore.refresh(),
    successMsg: t('client.created'),
  }
);
</script>
