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
        <FormLabel for="name">
          {{ $t('client.name') }}
        </FormLabel>
        <div class="flex gap-1">
          <BaseInput
            id="name"
            v-model.trim="name"
            name="name"
            type="text"
            class="w-full"
          />
          <BaseSecondaryButton type="button" @click="generateName">
            <span class="text-sm whitespace-nowrap">
              {{ $t('client.generateName') }}
            </span>
          </BaseSecondaryButton>
        </div>
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
import { generateRandomAlphanumeric } from '#shared/utils/random';

const name = ref<string>('');
const expiresAt = ref<string | null>(null);
const trafficLimitGb = ref<string>('');
const clientsStore = useClientsStore();

const { t } = useI18n();

defineProps<{ triggerClass?: string }>();

function generateName() {
  const existingNames = new Set(
    (clientsStore.clients ?? []).map((c) => c.name.toLowerCase())
  );

  for (let attempt = 0; attempt < 100; attempt++) {
    const candidate = generateRandomAlphanumeric(6);
    if (!existingNames.has(candidate.toLowerCase())) {
      name.value = candidate;
      return;
    }
  }

  name.value = generateRandomAlphanumeric(6);
}

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
