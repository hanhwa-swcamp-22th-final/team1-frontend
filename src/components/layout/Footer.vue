<script setup>
/**
 * Footer — 화면 하단 고정 푸터
 *
 * 위치: position fixed, bottom 0, left: var(--sidebar-width), right: 0
 * 높이: var(--footer-height) — 105px
 *
 * 구조:
 *   [left]  CONK ● © 2026 CONK Fulfillment Platform. All rights reserved.
 *   [right] 이용약관 · 개인정보처리방침 · 고객센터 · v0.1.0
 *
 * ● : 4×4px 골드 점 (var(--gold), border-radius: 2px)
 */
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { ROLES } from '@/constants'

const auth = useAuthStore()

const ROLE_THEME_CLASS = {
  [ROLES.SYSTEM_ADMIN]: 'theme-system-admin',
  [ROLES.MASTER_ADMIN]: 'theme-master-admin',
  [ROLES.WH_MANAGER]: 'theme-wh-manager',
  [ROLES.WH_WORKER]: 'theme-wh-worker',
  [ROLES.SELLER]: 'theme-seller',
}

const roleThemeClass = computed(() => ROLE_THEME_CLASS[auth.role] ?? 'theme-system-admin')
</script>

<template>
  <footer :class="['app-footer', roleThemeClass]">
    <div class="footer-left">
      <span class="footer-brand">CONK</span>
      <span class="footer-dot" />
      <span class="footer-copy">© 2026 CONK Fulfillment Platform. All rights reserved.</span>
    </div>
    <div class="footer-right">
      <a class="footer-link" href="#">이용약관</a>
      <a class="footer-link" href="#">개인정보처리방침</a>
      <a class="footer-link" href="#">고객센터</a>
      <span class="footer-version">v0.1.0</span>
    </div>
  </footer>
</template>

<style scoped>
.app-footer {
  --footer-role-bg: #0d0d0d;
  --footer-role-border: #2a2a2a;
  --footer-role-chip: #1e1e1e;
  position: fixed;
  bottom: 0;
  left: 0; /* 전체 너비 (사이드바 포함) */
  right: 0;
  height: var(--footer-height); /* 105px */
  background: var(--footer-role-bg); /* 역할별 푸터 색상 */
  border-top: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 36px;
  z-index: var(--z-header);
}

.theme-system-admin {
  --footer-role-bg: #433124;
  --footer-role-border: #9a7860;
  --footer-role-chip: #5a4334;
}

.theme-master-admin {
  --footer-role-bg: #173557;
  --footer-role-border: #4f7fb6;
  --footer-role-chip: #20456d;
}

.theme-wh-manager {
  --footer-role-bg: #174449;
  --footer-role-border: #4b969f;
  --footer-role-chip: #1f565c;
}

.theme-wh-worker {
  --footer-role-bg: #3f4c2c;
  --footer-role-border: #8da46a;
  --footer-role-chip: #51613a;
}

.theme-seller {
  --footer-role-bg: #543043;
  --footer-role-border: #b27a96;
  --footer-role-chip: #673a50;
}

.footer-left {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #fff;
}

.footer-brand {
  font-family: var(--font-condensed);
  font-weight: 700;
  color: #fff;
  font-size: 18px;
  letter-spacing: 4px; /* 기존 0.5px → 4px */
}

.footer-dot {
  width: 4px;
  height: 4px;
  background: var(--gold);
  border-radius: 2px;
  flex-shrink: 0;
}

.footer-copy {
  font-family: 'Inter', sans-serif;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.6); /* 기존 t4 → 반투명 흰색 */
}

.footer-right {
  display: flex;
  align-items: center;
  gap: 18px;
}

.footer-link {
  font-family: var(--font-barlow);
  font-size: 12px;
  color: rgba(255, 255, 255, 0.72); /* 기존 t4 → 반투명 흰색 */
  text-decoration: none;
}

.footer-link:hover {
  opacity: 0.8;
  color: rgba(255, 255, 255, 0.72);
}

.footer-version {
  padding: 4px 10px;
  background: var(--footer-role-chip);
  border: 1px solid var(--footer-role-border);
  border-radius: 4px;
  font-family: 'Inter', sans-serif;
  font-size: 10px;
  color: #fff;
}
</style>
