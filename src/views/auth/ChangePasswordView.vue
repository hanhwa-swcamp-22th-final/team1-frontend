<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { changePassword } from '@/api/member'
import { getFirstMenuRoute } from '@/components/layout/menus'
import { ROUTE_NAMES } from '@/constants'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const auth = useAuthStore()

const newPassword = ref('')
const confirmPassword = ref('')
const errorMsg = ref('')
const successMsg = ref('')
const isLoading = ref(false)

const displayName = computed(() => auth.user?.name ?? '사용자')
const displayEmail = computed(() => auth.user?.email ?? '이메일 정보 없음')
const displayRole = computed(() => auth.role ?? '')

function validateForm() {
  if (!newPassword.value || !confirmPassword.value) {
    return '새 비밀번호와 확인 비밀번호를 모두 입력해주세요.'
  }

  if (newPassword.value.length < 8) {
    return '비밀번호는 8자 이상으로 입력해주세요.'
  }

  if (newPassword.value !== confirmPassword.value) {
    return '비밀번호 확인이 일치하지 않습니다.'
  }

  return ''
}

async function handleSubmit() {
  errorMsg.value = ''
  successMsg.value = ''

  const validationError = validateForm()
  if (validationError) {
    errorMsg.value = validationError
    return
  }

  isLoading.value = true

  try {
    const response = await changePassword({ newPassword: newPassword.value })
    const data = response.data?.data ?? {}

    auth.updateUserStatus(data.accountStatus ?? 'ACTIVE')
    successMsg.value = '비밀번호가 변경되었습니다. 내 권한 페이지로 이동합니다.'

    const first = getFirstMenuRoute(auth.role)
    await router.replace(first ? { name: first } : { name: ROUTE_NAMES.LOGIN })
  } catch (error) {
    if (error.response?.status === 403) {
      errorMsg.value = '임시 비밀번호 상태의 계정만 비밀번호를 변경할 수 있습니다.'
    } else if (error.response?.status === 401) {
      errorMsg.value = '로그인 세션이 만료되었습니다. 다시 로그인해주세요.'
    } else {
      errorMsg.value = '비밀번호 변경에 실패했습니다. 잠시 후 다시 시도해주세요.'
    }
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="page">
    <header class="topbar">
      <div class="brand">
        <div class="logo-badge">CK</div>
        <div class="brand-text">
          <strong>CONK</strong>
          <span>Fulfillment Platform</span>
        </div>
      </div>
    </header>

    <main class="content">
      <section class="frame">
        <div class="change-wrap">
          <div class="change-card">
            <div class="change-head">
              <p class="eyebrow">보안 설정</p>
              <h1>비밀번호 재설정</h1>
              <p class="description">
                임시 비밀번호로 로그인한 계정은 비밀번호를 변경한 뒤에만 서비스를 이용할 수 있습니다.
              </p>
            </div>

            <div class="account-panel">
              <div class="account-item">
                <span class="account-label">사용자</span>
                <strong>{{ displayName }}</strong>
              </div>
              <div class="account-item">
                <span class="account-label">로그인 ID</span>
                <strong>{{ displayEmail }}</strong>
              </div>
              <div class="account-item">
                <span class="account-label">권한</span>
                <strong>{{ displayRole }}</strong>
              </div>
            </div>

            <form class="form-grid" @submit.prevent="handleSubmit">
              <div class="field">
                <label for="newPassword">새 비밀번호</label>
                <input
                  id="newPassword"
                  v-model="newPassword"
                  class="input"
                  type="password"
                  placeholder="8자 이상으로 입력하세요"
                  autocomplete="new-password"
                  required
                />
              </div>

              <div class="field">
                <label for="confirmPassword">새 비밀번호 확인</label>
                <input
                  id="confirmPassword"
                  v-model="confirmPassword"
                  class="input"
                  type="password"
                  placeholder="비밀번호를 한 번 더 입력하세요"
                  autocomplete="new-password"
                  required
                />
              </div>

              <p class="inline-note">
                비밀번호 변경이 완료되면 내 권한에 맞는 첫 화면으로 자동 이동합니다.
              </p>

              <div v-if="errorMsg" class="alert alert--error">{{ errorMsg }}</div>
              <div v-if="successMsg" class="alert alert--info">{{ successMsg }}</div>

              <div class="button-area">
                <button type="submit" class="btn-submit" :disabled="isLoading">
                  {{ isLoading ? '변경 중...' : '비밀번호 변경' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<style scoped>
.page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  font-family: 'Barlow', sans-serif;
  background:
    radial-gradient(circle at 10% 8%, rgba(245, 158, 11, 0.12), transparent 24%),
    radial-gradient(circle at 92% 15%, rgba(17, 24, 39, 0.06), transparent 20%),
    linear-gradient(180deg, #fafafa 0%, #f3f4f6 100%);
}

.topbar {
  height: 92px;
  display: flex;
  align-items: center;
  padding: 0 36px;
  background: rgba(13, 13, 13, 0.96);
  border-bottom: 1px solid rgba(255, 212, 140, 0.18);
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
  box-shadow: 0 12px 24px rgba(245, 158, 11, 0.24);
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
  color: rgba(255, 255, 255, 0.72);
  font-weight: 700;
}

.content {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 36px 20px;
}

.frame {
  width: min(100%, 980px);
  padding: 40px 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.change-wrap {
  width: min(100%, 760px);
  border-radius: 28px;
  background: rgba(235, 235, 235, 0.92);
  border: 1px solid #e2e2e2;
  padding: 28px;
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.1);
}

.change-card {
  background: #ffffff;
  border: 1px solid #d1d5db;
  border-radius: 24px;
  padding: 34px;
  width: min(100%, 560px);
  margin: 0 auto;
  box-shadow: 0 10px 28px rgba(15, 23, 42, 0.06);
}

.change-head {
  display: grid;
  gap: 10px;
  margin-bottom: 24px;
}

.eyebrow {
  margin: 0;
  color: #b45309;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 1.6px;
  text-transform: uppercase;
}

.change-head h1 {
  margin: 0;
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 40px;
  letter-spacing: 0.8px;
  color: #111827;
}

.description {
  margin: 0;
  color: #4b5563;
  font-size: 14px;
  line-height: 1.6;
}

.account-panel {
  display: grid;
  gap: 12px;
  margin-bottom: 22px;
  padding: 16px 18px;
  border-radius: 18px;
  background: #fafafa;
  border: 1px solid #e5e7eb;
}

.account-item {
  display: grid;
  gap: 4px;
}

.account-label {
  font-size: 12px;
  font-weight: 700;
  color: #6b7280;
}

.account-item strong {
  color: #111827;
  font-size: 15px;
}

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
  transition: border-color 0.15s, box-shadow 0.15s;
}

.input:focus {
  border-color: #f59e0b;
  box-shadow: 0 0 0 4px rgba(245, 158, 11, 0.1);
}

.inline-note {
  margin: -2px 0 0;
  font-size: 12px;
  color: #6b7280;
  line-height: 1.55;
}

.alert {
  padding: 13px 14px;
  border-radius: 16px;
  border: 1px solid transparent;
  font-size: 13px;
  line-height: 1.55;
  font-weight: 500;
}

.alert--error {
  background: rgba(220, 38, 38, 0.1);
  color: #b91c1c;
  border-color: rgba(185, 28, 28, 0.18);
}

.alert--info {
  background: rgba(15, 118, 110, 0.1);
  color: #0f766e;
  border-color: rgba(15, 118, 110, 0.18);
}

.button-area {
  padding-top: 6px;
}

.btn-submit {
  width: 100%;
  height: 56px;
  border: none;
  border-radius: 16px;
  background: #f59e0b;
  color: #0d0d0d;
  font-family: 'Barlow', sans-serif;
  font-size: 18px;
  font-weight: 800;
  cursor: pointer;
  box-shadow: 0 14px 28px rgba(245, 158, 11, 0.22);
  transition: transform 0.15s, filter 0.15s;
}

.btn-submit:hover {
  transform: translateY(-1px);
  filter: brightness(1.02);
}

.btn-submit:disabled {
  cursor: not-allowed;
  opacity: 0.7;
  transform: none;
}

@media (max-width: 720px) {
  .topbar {
    padding: 0 18px;
  }

  .content {
    padding: 18px 14px;
  }

  .frame {
    padding: 24px 14px;
  }

  .change-wrap {
    padding: 16px;
  }

  .change-card {
    padding: 24px 18px 22px;
  }

  .change-head h1 {
    font-size: 34px;
  }
}
</style>
