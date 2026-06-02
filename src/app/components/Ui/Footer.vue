<template>
  <footer>
    <p class="m-10 text-center text-xs text-gray-300 dark:text-neutral-600">
      <a
        class="hover:underline"
        target="_blank"
        href="https://github.com/RTLBD/wg"
        >wg</a
      >
      ({{ globalStore.information?.currentRelease }}) ·
      <a
        class="hover:underline"
        target="_blank"
        href="https://opensource.org/license/agpl-v3"
        >AGPL-3.0-only</a
      >
    </p>
  </footer>
</template>

<script lang="ts" setup>
const globalStore = useGlobalStore();
</script>
