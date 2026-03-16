<script setup>
import { RouterView } from 'vue-router'
import { useUiStore } from '@/stores/ui'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'

const ui = useUiStore()
</script>

<template>
  <RouterView />
  <LoadingSpinner v-if="ui.isLoading" fullscreen />
</template>
