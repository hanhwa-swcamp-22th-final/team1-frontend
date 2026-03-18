<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import { login } from '@/api/member'
import { ROLES, ROUTE_NAMES } from '@/constants'

const router = useRouter()
const route  = useRoute()
const auth   = useAuthStore()
const ui     = useUiStore()

const loginId  = ref('')
const password = ref('')
const errorMsg = ref('')
const infoMsg  = ref('')

const DASHBOARD_BY_ROLE = {
  [ROLES.SELLER]:       ROUTE_NAMES.SELLER_DASHBOARD,
  [ROLES.MASTER_ADMIN]: ROUTE_NAMES.MASTER_DASHBOARD,
  [ROLES.WH_MANAGER]:   ROUTE_NAMES.WH_MANAGER_DASHBOARD,
  [ROLES.WH_WORKER]:    ROUTE_NAMES.WH_WORKER_DASHBOARD,
  [ROLES.SYSTEM_ADMIN]: ROUTE_NAMES.SYS_COMPANY_LIST,
}

const roles = [
  { id: 'sys',    name: '시스템 관리자', desc: '플랫폼 전체 사용자·업체 관리',            loginId: 'sys.admin@conk.com',    pw: '1234', note: '정상 로그인 예시' },
  { id: 'master', name: '총괄 관리자',   desc: '3PL 업체 운영, 셀러 회사·계정 관리',      loginId: 'master.admin@conk.com', pw: '1234', note: '정상 로그인 예시' },
  { id: 'whm',    name: '창고 관리자',   desc: '창고 운영, 로케이션·재고·작업자 관리',    loginId: 'wh.manager@conk.com',   pw: '1234', note: '정상 로그인 예시' },
  { id: 'worker', name: '창고 작업자',   desc: '이메일 미등록 가능 · 작업자 코드 로그인', loginId: 'WORKER-001',            pw: '1234', note: '로그인 시 작업 화면으로 이동' },
  { id: 'seller', name: '셀러 담당자',   desc: '상품·ASN·주문·재고 알림 확인',           loginId: 'seller@conk.com',       pw: '1234', note: '정상 로그인 예시' },
]

const openRoles = ref({})

function toggleRole(id) {
  openRoles.value[id] = !openRoles.value[id]
}

function fillCredentials(role) {
  loginId.value  = role.loginId
  password.value = role.pw
  errorMsg.value = ''
  infoMsg.value  = ''
}

async function handleSubmit() {
  errorMsg.value = ''
  infoMsg.value  = ''
  ui.setLoading(true)
  try {
    const res  = await login({ email: loginId.value, password: password.value })
    const data = res.data.data

    auth.setAuth({
      user:         { name: data.user.name, email: data.user.email, status: data.user.status, organization: data.user.organization ?? null },
      token:        data.token,
      role:         data.user.role,
      tenantCode:   data.tenantCode   ?? null,
      customerCode: data.customerCode ?? null,
    })

    const redirect  = route.query.redirect
    const dashboard = DASHBOARD_BY_ROLE[data.user.role]

    if (redirect) {
      router.replace(redirect)
    } else if (dashboard) {
      router.push({ name: dashboard })
    } else {
      router.push('/')
    }
  } catch (err) {
    if (err.response?.status === 401) {
      errorMsg.value = '로그인 ID 또는 비밀번호를 확인해주세요.'
    } else {
      errorMsg.value = '서버 연결에 실패했습니다. 잠시 후 다시 시도해주세요.'
    }
  } finally {
    ui.setLoading(false)
  }
}
</script>

<template>
  <div class="page">
    <!-- 헤더 -->
    <header class="topbar">
      <div class="brand">
        <div class="logo-badge">CK</div>
        <div class="brand-text">
          <strong>CONK</strong>
          <span>Fulfillment Platform</span>
        </div>
      </div>
    </header>

    <!-- 메인 -->
    <main class="content">
      <section class="frame">
        <div class="login-wrap">
          <div class="login-card">
            <div class="login-head">
              <h1>로그인</h1>
            </div>

            <form class="form-grid" @submit.prevent="handleSubmit">
              <div class="field">
                <label for="loginId">로그인 ID</label>
                <input
                  id="loginId"
                  v-model="loginId"
                  class="input"
                  type="text"
                  placeholder="이메일 또는 작업자 코드"
                  autocomplete="username"
                  required
                />
              </div>

              <div class="field">
                <label for="password">비밀번호</label>
                <input
                  id="password"
                  v-model="password"
                  class="input"
                  type="password"
                  placeholder="비밀번호를 입력하세요"
                  autocomplete="current-password"
                  required
                />
              </div>


              <div v-if="errorMsg" class="alert alert--error">{{ errorMsg }}</div>
              <div v-if="infoMsg"  class="alert alert--info">{{ infoMsg }}</div>

              <div class="button-area">
                <button type="submit" class="btn-login">로그인</button>
              </div>
            </form>

            <!-- 역할별 임시 계정 토글 -->
            <div class="toggle-box">
              <div class="toggle-head">
                <strong>역할별 임시 계정</strong>
                <span>토글을 열어 계정을 확인하고 입력칸에 적용하세요.</span>
              </div>

              <div
                v-for="role in roles"
                :key="role.id"
                class="role-toggle"
                :class="{ open: openRoles[role.id] }"
              >
                <button type="button" class="role-trigger" @click="toggleRole(role.id)">
                  <span class="role-left">
                    <span class="role-name">{{ role.name }}</span>
                    <span class="role-desc">{{ role.desc }}</span>
                  </span>
                  <span class="role-arrow">⌄</span>
                </button>
                <div class="role-panel">
                  <div class="credential-lines">
                    <strong>아이디: {{ role.loginId }}</strong>
                    <strong>비밀번호: {{ role.pw }}</strong>
                    <span>{{ role.note }}</span>
                  </div>
                  <button type="button" class="fill-button" @click="fillCredentials(role)">
                    이 계정 사용
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>

    <!-- 푸터 -->
    <footer class="footer">
      <div class="footer-left">
        <span class="footer-brand">CONK</span>
        <span class="footer-copy">© 2026 CONK Fulfillment Platform. All rights reserved.</span>
      </div>
      <div class="footer-right">
        <a href="#" class="footer-link">이용약관</a>
        <a href="#" class="footer-link">개인정보처리방침</a>
        <a href="#" class="footer-link">고객지원 문의</a>
        <span class="footer-ver">v1.0.1</span>
      </div>
    </footer>
  </div>
</template>

<style scoped>
/* ── 페이지 전체 ── */
.page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  font-family: 'Barlow', sans-serif;
  background:
    radial-gradient(circle at 10% 8%,  rgba(245, 158, 11, .12), transparent 24%),
    radial-gradient(circle at 92% 15%, rgba(17, 24, 39, .06),   transparent 20%),
    linear-gradient(180deg, #fafafa 0%, #f3f4f6 100%);
}

/* ── 헤더 ── */
.topbar {
  height: 92px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  padding: 0 36px;
  background: rgba(13, 13, 13, .96);
  border-bottom: 1px solid rgba(255, 212, 140, .18);
  backdrop-filter: blur(14px);
}

.brand {
  display: flex;
  align-items: center;
  gap: 14px;
}

.logo-badge {
  width: 48px;
  height: 48px;
  display: grid;
  place-items: center;
  border-radius: 14px;
  background: #f59e0b;
  color: #0d0d0d;
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 20px;
  font-weight: 700;
  letter-spacing: 1px;
  box-shadow: 0 12px 24px rgba(245, 158, 11, .24);
}

.brand-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.brand-text strong {
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 32px;
  line-height: 1;
  letter-spacing: 4px;
  font-weight: 700;
  color: #fff;
}

.brand-text span {
  font-size: 11px;
  letter-spacing: 1.8px;
  text-transform: uppercase;
  color: rgba(255, 255, 255, .72);
  font-weight: 700;
}

.topbar-note {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border-radius: 999px;
  background: rgba(255, 255, 255, .05);
  border: 1px solid rgba(255, 255, 255, .08);
  color: rgba(255, 255, 255, .78);
  font-size: 12px;
  font-weight: 600;
}

.topbar-note::before {
  content: '';
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #f59e0b;
  box-shadow: 0 0 0 6px rgba(245, 158, 11, .10);
}

/* ── 메인 콘텐츠 ── */
.content {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 36px 20px;
}

.frame {
  width: min(100%, 1180px);
  min-height: 620px;
  padding: 56px 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.login-wrap {
  width: min(100%, 760px);
  border-radius: 28px;
  background: rgba(235, 235, 235, .92);
  border: 1px solid #e2e2e2;
  padding: 28px;
  box-shadow: 0 24px 60px rgba(15, 23, 42, .10);
}

.login-card {
  background: #ffffff;
  border: 1px solid #d1d5db;
  border-radius: 24px;
  padding: 34px 34px 28px;
  width: min(100%, 480px);
  margin: 0 auto;
  box-shadow: 0 10px 28px rgba(15, 23, 42, .06);
}

/* ── 로그인 헤더 ── */
.login-head {
  text-align: center;
  margin-bottom: 22px;
}

.login-head h1 {
  margin: 0;
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 42px;
  letter-spacing: .8px;
  color: #111827;
}

/* ── 폼 ── */
.form-grid {
  display: grid;
  gap: 14px;
}

.field {
  display: grid;
  gap: 8px;
}

.field label {
  font-size: 13px;
  font-weight: 700;
  color: #1f2937;
}

.input {
  width: 100%;
  height: 52px;
  border-radius: 14px;
  border: 1px solid #d1d5db;
  background: #fff;
  color: #111827;
  font-family: 'Barlow', sans-serif;
  font-size: 15px;
  padding: 0 16px;
  outline: none;
  transition: border-color .15s, box-shadow .15s;
}

.input:focus {
  border-color: #f59e0b;
  box-shadow: 0 0 0 4px rgba(245, 158, 11, .10);
}

.inline-note {
  font-size: 12px;
  color: #6b7280;
  line-height: 1.55;
  margin-top: -2px;
}

/* ── 알림 박스 ── */
.alert {
  padding: 13px 14px;
  border-radius: 16px;
  border: 1px solid transparent;
  font-size: 13px;
  line-height: 1.55;
  font-weight: 500;
}

.alert--error {
  background: rgba(220, 38, 38, .10);
  color: #b91c1c;
  border-color: rgba(185, 28, 28, .18);
}

.alert--info {
  background: rgba(15, 118, 110, .10);
  color: #0f766e;
  border-color: rgba(15, 118, 110, .18);
}

/* ── 로그인 버튼 ── */
.button-area {
  text-align: center;
  padding-top: 6px;
}

.btn-login {
  width: 100%;
  max-width: 180px;
  height: 56px;
  border: none;
  border-radius: 16px;
  background: #f59e0b;
  color: #0d0d0d;
  font-family: 'Barlow', sans-serif;
  font-size: 18px;
  font-weight: 800;
  cursor: pointer;
  box-shadow: 0 14px 28px rgba(245, 158, 11, .22);
  transition: transform .15s, filter .15s;
}

.btn-login:hover {
  transform: translateY(-1px);
  filter: brightness(1.02);
}

/* ── 역할별 토글 박스 ── */
.toggle-box {
  margin-top: 22px;
  padding: 16px;
  border-radius: 18px;
  background: #fafafa;
  border: 1px solid #e5e7eb;
  display: grid;
  gap: 12px;
}

.toggle-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.toggle-head strong {
  font-size: 14px;
  color: #111827;
}

.toggle-head span {
  font-size: 12px;
  color: #6b7280;
}

.role-toggle {
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  background: #fff;
  overflow: hidden;
}

.role-trigger {
  width: 100%;
  border: none;
  background: transparent;
  padding: 14px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  cursor: pointer;
  text-align: left;
  font-family: 'Barlow', sans-serif;
}

.role-trigger:hover {
  background: rgba(245, 158, 11, .04);
}

.role-left {
  display: grid;
  gap: 4px;
}

.role-name {
  font-size: 13px;
  font-weight: 800;
  color: #b45309;
}

.role-desc {
  font-size: 12px;
  color: #6b7280;
}

.role-arrow {
  flex: 0 0 auto;
  font-size: 16px;
  color: #9ca3af;
  transition: transform .18s ease;
}

.role-toggle.open .role-arrow {
  transform: rotate(180deg);
}

.role-panel {
  display: none;
  border-top: 1px solid #e5e7eb;
  padding: 14px 16px 16px;
  background: #fcfcfc;
  gap: 10px;
}

.role-toggle.open .role-panel {
  display: grid;
}

.credential-lines {
  display: grid;
  gap: 6px;
  font-size: 13px;
  color: #111827;
}

.credential-lines span {
  color: #6b7280;
  font-size: 12px;
}

.fill-button {
  justify-self: start;
  border: 1px solid rgba(245, 158, 11, .24);
  background: rgba(245, 158, 11, .10);
  color: #b45309;
  border-radius: 999px;
  padding: 9px 14px;
  font-family: 'Barlow', sans-serif;
  font-size: 12px;
  font-weight: 800;
  cursor: pointer;
  transition: filter .15s;
}

.fill-button:hover {
  filter: brightness(.98);
}

/* ── 푸터 ── */
.footer {
  height: 82px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 0 36px;
  background: rgba(13, 13, 13, .96);
  border-top: 1px solid rgba(255, 212, 140, .18);
}

.footer-left,
.footer-right {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.footer-brand {
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 22px;
  letter-spacing: 4px;
  color: #fff;
}

.footer-copy,
.footer-link {
  font-size: 12px;
  color: rgba(255, 255, 255, .78);
  text-decoration: none;
}

.footer-ver {
  font-size: 12px;
  color: rgba(255, 255, 255, .78);
  padding: 6px 10px;
  border-radius: 999px;
  background: #1e1e1e;
  border: 1px solid #2a2a2a;
}

/* ── 반응형 ── */
@media (max-width: 720px) {
  .topbar,
  .footer {
    padding-left: 18px;
    padding-right: 18px;
  }

  .topbar-note {
    display: none;
  }

  .content {
    padding: 18px 14px;
  }

  .frame {
    min-height: auto;
    padding: 24px 14px;
    border-radius: 24px;
  }

  .login-wrap {
    padding: 16px;
  }

  .login-card {
    padding: 24px 18px 22px;
  }

  .login-head h1 {
    font-size: 34px;
  }

  .btn-login {
    max-width: 100%;
  }

  .footer {
    height: auto;
    padding-top: 16px;
    padding-bottom: 16px;
  }
}
</style>
