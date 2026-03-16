<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()
</script>

<template>
  <div class="ui-state-page">
    <h1 class="ui-state-page__code not-found-code">404</h1>
    <p class="ui-state-page__message">페이지를 찾을 수 없습니다.</p>
    <button class="ui-btn ui-btn--ghost" @click="router.back()">← 돌아가기</button>
  </div>
</template>

<style scoped>
.not-found-code {
  color: var(--blue);
}
</style>
