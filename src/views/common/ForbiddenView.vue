<script setup>
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
const router = useRouter()
const auth   = useAuthStore()
</script>

<template>
  <div class="ui-state-page">
    <h1 class="ui-state-page__code forbidden-code">403</h1>
    <p class="ui-state-page__message">접근 권한이 없습니다.</p>
    <p class="ui-state-page__sub">현재 역할: <strong>{{ auth.role ?? '비로그인' }}</strong></p>
    <button class="ui-btn ui-btn--ghost" @click="router.back()">← 돌아가기</button>
  </div>
</template>

<style scoped>
.forbidden-code { color: var(--red); }
</style>
