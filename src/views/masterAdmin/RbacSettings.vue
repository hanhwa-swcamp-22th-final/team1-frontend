<script setup>
/**
 * RbacSettings — 총괄관리자 역할별 접근 권한 매트릭스 (RBAC)
 *
 * 레이아웃: 안내 배너 + 역할 탭 (WH_MANAGER / WH_WORKER) + 권한 매트릭스 테이블
 * 데이터: 정적 하드코딩 (API 미정의), reactive 객체로 체크박스 상태 관리
 */
import { ref, reactive } from 'vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import ToastMessage from '@/components/common/ToastMessage.vue'

const breadcrumb = [{ label: '사용자 관리' }, { label: '역할별 접근 권한 매트릭스' }]

// ── 역할 탭 ──────────────────────────────────────────────────────────────────
const ROLE_TABS = [
  { key: 'WH_MANAGER', label: 'WH_MANAGER (창고 관리자)', count: 12 },
  { key: 'WH_WORKER',  label: 'WH_WORKER (창고 작업자)',  count: 10 },
]
const activeRole = ref('WH_MANAGER')

// ── 권한 매트릭스 데이터 ──────────────────────────────────────────────────────
const SECTIONS = [
  {
    label: '대시보드',
    items: [
      { id: 'WM-DASH-01', depth1: '대시보드',    depth2: '운영 현황',     func: '일일 운영 대시보드',          req: 'REQ-018', apiKey: 'dashboard.read',
        workerLockedPerms: ['w', 'd'],
        WH_MANAGER: { r: true,  w: false, d: false },
        WH_WORKER:  { r: true,  w: false, d: false },
      },
    ],
  },
  {
    label: '입고 관리',
    items: [
      { id: 'WM-IN-01', depth1: '입고 관리', depth2: 'ASN 접수',  func: 'ASN 목록 조회',         req: 'REQ-019', apiKey: 'asn.read',
        workerLockedPerms: ['w', 'd'],
        WH_MANAGER: { r: true,  w: false, d: false },
        WH_WORKER:  { r: true,  w: false, d: false },
      },
      { id: 'WM-IN-02', depth1: '입고 관리', depth2: 'ASN 접수',  func: 'ASN 상세 조회',         req: 'REQ-020', apiKey: 'asn.detail.read',
        workerLockedPerms: ['w', 'd'],
        WH_MANAGER: { r: true,  w: false, d: false },
        WH_WORKER:  { r: true,  w: false, d: false },
      },
      { id: 'WM-IN-04', depth1: '입고 관리', depth2: '입고 확정', func: '입고 확정 및 작업 배정', req: 'REQ-022', apiKey: 'inbound.assign.write',
        workerLockedPerms: ['w', 'd'],
        WH_MANAGER: { r: true,  w: true,  d: false },
        WH_WORKER:  { r: true,  w: false, d: false },
      },
      { id: 'WM-IN-06', depth1: '입고 관리', depth2: '검수 확인', func: '입고 확정 처리',         req: 'REQ-024', apiKey: 'inbound.confirm.write',
        workerLockedPerms: ['d'],
        WH_MANAGER: { r: true,  w: true,  d: false },
        WH_WORKER:  { r: true,  w: true,  d: false },
      },
    ],
  },
  {
    label: '로케이션 관리',
    items: [
      { id: 'WM-LOC-01', depth1: '로케이션', depth2: '로케이션 설정', func: 'Zone-Rack-Bin 구조 생성', req: 'REQ-025', apiKey: 'location.write',
        workerLockedPerms: ['w', 'd'],
        WH_MANAGER: { r: true,  w: true,  d: false },
        WH_WORKER:  { r: true,  w: false, d: false },
      },
      { id: 'WM-LOC-03', depth1: '로케이션', depth2: '로케이션 설정', func: '로케이션 수정 및 삭제',    req: 'REQ-043', apiKey: 'location.delete',
        workerLockedPerms: ['w', 'd'],
        WH_MANAGER: { r: true,  w: true,  d: true  },
        WH_WORKER:  { r: true,  w: false, d: false },
      },
    ],
  },
  {
    label: '출고 관리',
    items: [
      { id: 'WM-OUT-01', depth1: '출고 관리', depth2: '출고 지시', func: '주문 출고 지시',          req: 'REQ-030', apiKey: 'shipment.instruction.write',
        workerLockedPerms: ['w', 'd'],
        WH_MANAGER: { r: true,  w: true,  d: false },
        WH_WORKER:  { r: true,  w: false, d: false },
      },
      { id: 'WM-OUT-04', depth1: '출고 관리', depth2: '송장 발행', func: '배송 라벨 자동 출력',      req: 'REQ-033', apiKey: 'label.write',
        workerLockedPerms: ['w', 'd'],
        WH_MANAGER: { r: true,  w: true,  d: false },
        WH_WORKER:  { r: true,  w: false, d: false },
      },
      { id: 'WM-OUT-05', depth1: '출고 관리', depth2: '출고 확정', func: '출고 확정 및 재고 차감',   req: 'REQ-034', apiKey: 'shipment.confirm.write',
        workerLockedPerms: ['d'],
        WH_MANAGER: { r: true,  w: true,  d: false },
        WH_WORKER:  { r: true,  w: true,  d: false },
      },
    ],
  },
  {
    label: '사용자 관리',
    lockedForWorker: true,
    items: [
      { id: 'WM-USER-01', depth1: '사용자 관리', depth2: '작업자 발급', func: '창고 작업자 계정 직접 발급', req: 'REQ-035', apiKey: 'worker.create.write',
        WH_MANAGER: { r: true,  w: true,  d: false },
        WH_WORKER:  { r: false, w: false, d: false },
      },
      { id: 'WM-USER-04', depth1: '사용자 관리', depth2: '작업자 관리', func: '작업자 비밀번호 초기화',     req: 'REQ-060', apiKey: 'worker.password.reset.write',
        WH_MANAGER: { r: true,  w: true,  d: false },
        WH_WORKER:  { r: false, w: false, d: false },
      },
    ],
  },
]

// ── 체크박스 상태 (reactive) — itemId_role_perm ──────────────────────────────
const perms = reactive({})

for (const section of SECTIONS) {
  for (const item of section.items) {
    for (const role of ['WH_MANAGER', 'WH_WORKER']) {
      for (const perm of ['r', 'w', 'd']) {
        perms[`${item.id}_${role}_${perm}`] = item[role][perm]
      }
    }
  }
}

function getPerm(id, role, perm) {
  return perms[`${id}_${role}_${perm}`]
}
function togglePerm(id, role, perm) {
  perms[`${id}_${role}_${perm}`] = !perms[`${id}_${role}_${perm}`]
}

/** WH_WORKER 탭에서 해당 셀이 시스템 고정(변경 불가)인지 확인 */
function isCellLocked(item, section, perm) {
  if (activeRole.value !== 'WH_WORKER') return false
  if (section.lockedForWorker) return true
  return item.workerLockedPerms?.includes(perm) ?? false
}

// ── 저장 토스트 ──────────────────────────────────────────────────────────────
// 저장 성공 알림은 공통 ToastMessage 로 표시한다.
const saveToast = ref(false)

function saveChanges() {
  // 실제 저장 API 연동 전까지는 토스트 표시만 유지한다.
  saveToast.value = true
}
</script>

<template>
  <AppLayout :breadcrumb="breadcrumb" title="권한 설정 (RBAC)">
    <!-- RBAC 저장 완료 알림 공통화 -->
    <ToastMessage
      v-model:visible="saveToast"
      message="권한이 성공적으로 저장되었습니다."
      type="success"
    />
    <template #header-action>
      <button class="ui-btn ui-btn--gold" @click="saveChanges">변경사항 저장</button>
    </template>

    <!-- 안내 배너 -->
    <div class="notice-banner">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="7" stroke="var(--blue)" stroke-width="1.5"/>
        <path d="M8 7v5" stroke="var(--blue)" stroke-width="1.5" stroke-linecap="round"/>
        <circle cx="8" cy="5" r="0.8" fill="var(--blue)"/>
      </svg>
      <p>
        <strong>운영 매뉴얼</strong>
        읽기(R)는 조회 권한, 쓰기(W)는 등록·수정·배정 권한, 삭제(D)는 삭제·취소·비활성화 권한을 의미합니다.
        서버 API 권한과 동일 기준으로 적용되며, 변경 이력은 자동 기록됩니다.
      </p>
    </div>

    <!-- 역할 탭 -->
    <div class="role-tabs">
      <button
        v-for="tab in ROLE_TABS"
        :key="tab.key"
        class="role-tab"
        :class="{ active: activeRole === tab.key }"
        @click="activeRole = tab.key"
      >
        {{ tab.label }}
        <span class="role-tab-count">{{ tab.count }}개 기능</span>
      </button>
    </div>

    <!-- 권한 매트릭스 카드 -->
    <div class="matrix-card">
      <table class="matrix-table">
        <thead>
          <tr>
            <th style="width:110px;">메뉴 ID</th>
            <th style="width:130px;">1Depth</th>
            <th style="width:130px;">2Depth</th>
            <th>기능명</th>
            <th class="col-perm">읽기 R</th>
            <th class="col-perm">쓰기 W</th>
            <th class="col-perm">삭제 D</th>
          </tr>
        </thead>
        <tbody>
          <template v-for="section in SECTIONS" :key="section.label">
            <!-- 섹션 헤더 -->
            <tr class="section-header-row">
              <td colspan="7">
                <span class="section-label">{{ section.label }}</span>
                <!-- WH_WORKER 탭에서 lockedForWorker 섹션에 잠금 배지 표시 -->
                <span
                  v-if="section.lockedForWorker && activeRole === 'WH_WORKER'"
                  class="locked-badge"
                >
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <rect x="3" y="11" width="18" height="11" rx="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                  WH_WORKER 시스템 고정 — 변경 불가
                </span>
              </td>
            </tr>
            <!-- 데이터 행 -->
            <tr
              v-for="item in section.items"
              :key="item.id"
              class="data-row"
              :class="{ 'row-locked': section.lockedForWorker && activeRole === 'WH_WORKER' }"
            >
              <td><span class="menu-id">{{ item.id }}</span></td>
              <td><span class="depth1">{{ item.depth1 }}</span></td>
              <td><span class="depth2">{{ item.depth2 }}</span></td>
              <td><span class="func-name">{{ item.func }}</span></td>
              <td class="col-perm">
                <button
                  class="perm-check"
                  :class="[
                    getPerm(item.id, activeRole, 'r') ? 'perm-on' : 'perm-off',
                    isCellLocked(item, section, 'r') ? 'perm-locked' : '',
                  ]"
                  :disabled="isCellLocked(item, section, 'r')"
                  @click="!isCellLocked(item, section, 'r') && togglePerm(item.id, activeRole, 'r')"
                >
                  <svg v-if="isCellLocked(item, section, 'r')" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="lock-icon">
                    <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                  <svg v-else-if="getPerm(item.id, activeRole, 'r')" width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="var(--green)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </button>
              </td>
              <td class="col-perm">
                <button
                  class="perm-check"
                  :class="[
                    getPerm(item.id, activeRole, 'w') ? 'perm-on' : 'perm-off',
                    isCellLocked(item, section, 'w') ? 'perm-locked' : '',
                  ]"
                  :disabled="isCellLocked(item, section, 'w')"
                  @click="!isCellLocked(item, section, 'w') && togglePerm(item.id, activeRole, 'w')"
                >
                  <svg v-if="isCellLocked(item, section, 'w')" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="lock-icon">
                    <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                  <svg v-else-if="getPerm(item.id, activeRole, 'w')" width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="var(--green)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </button>
              </td>
              <td class="col-perm">
                <button
                  class="perm-check"
                  :class="[
                    getPerm(item.id, activeRole, 'd') ? 'perm-on' : 'perm-off',
                    isCellLocked(item, section, 'd') ? 'perm-locked' : '',
                  ]"
                  :disabled="isCellLocked(item, section, 'd')"
                  @click="!isCellLocked(item, section, 'd') && togglePerm(item.id, activeRole, 'd')"
                >
                  <svg v-if="isCellLocked(item, section, 'd')" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="lock-icon">
                    <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                  <svg v-else-if="getPerm(item.id, activeRole, 'd')" width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="var(--green)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </button>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
      <div class="matrix-footer">
        * 체크박스를 클릭하여 권한을 토글할 수 있습니다. 변경 후 상단의 "변경사항 저장" 버튼을 눌러 저장하세요.
      </div>
    </div>
  </AppLayout>
</template>

<style scoped>
/* ── 헤더 버튼 ── */
.ui-btn--gold {
  background: var(--gold);
  border: none;
  color: var(--t1);
  font-weight: 700;
  box-shadow: 0 2px 8px rgba(245,166,35,0.3);
}

/* ── 안내 배너 ── */
.notice-banner {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 20px;
  background: var(--blue-pale);
  border: 1px solid var(--blue);
  border-radius: 6px;
  margin-bottom: 24px;
}

.notice-banner svg { flex-shrink: 0; margin-top: 1px; }

.notice-banner p {
  font-family: 'Barlow', sans-serif;
  font-size: 13px;
  color: var(--blue);
  line-height: 1.6;
  margin: 0;
}

.notice-banner strong { font-weight: 700; }

/* ── 역할 탭 ── */
.role-tabs {
  display: flex;
  gap: 0;
  margin-bottom: 24px;
  border-bottom: 2px solid var(--border);
}

.role-tab {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 28px;
  font-family: 'Barlow Condensed', sans-serif;
  font-weight: 600;
  font-size: 15px;
  letter-spacing: 0.5px;
  color: var(--t3);
  cursor: pointer;
  border: none;
  background: none;
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
  transition: color var(--ease-fast), border-color var(--ease-fast);
  white-space: nowrap;
}

.role-tab.active {
  color: var(--t1);
  border-bottom-color: var(--gold);
}

.role-tab:hover:not(.active) { color: var(--t2); }

.role-tab-count {
  font-family: 'Barlow', sans-serif;
  font-weight: 400;
  font-size: 12px;
  color: var(--t4);
  letter-spacing: 0;
}

/* ── 매트릭스 카드 ── */
.matrix-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 8px;
  overflow: hidden;
}

.matrix-table {
  width: 100%;
  border-collapse: collapse;
}

.matrix-table thead th {
  padding: 10px 16px;
  font-family: 'Barlow', sans-serif;
  font-weight: 700;
  font-size: 11px;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  color: var(--t3);
  background: var(--surface);
  border-bottom: 1px solid var(--border);
  text-align: left;
  white-space: nowrap;
}

.matrix-table thead th.col-perm {
  text-align: center;
  min-width: 72px;
}

.matrix-table td {
  padding: 11px 16px;
  font-family: 'Barlow', sans-serif;
  font-size: 13px;
  color: var(--t2);
  border-bottom: 1px solid var(--border);
  vertical-align: middle;
}

.matrix-table tbody tr:last-child td { border-bottom: none; }

.data-row:hover td { background: var(--surface-2); }

.col-perm { text-align: center; }

/* ── 섹션 헤더 ── */
.section-header-row td {
  padding: 8px 16px;
  background: var(--surface-2);
}

.section-label {
  font-family: 'Barlow Condensed', sans-serif;
  font-weight: 700;
  font-size: 13px;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: var(--t2);
}

/* ── 셀 내용 ── */
.menu-id {
  font-family: 'IBM Plex Sans', monospace;
  font-size: 11px;
  color: var(--t3);
  background: var(--surface-2);
  padding: 2px 6px;
  border-radius: 3px;
  white-space: nowrap;
}

.depth1 {
  font-weight: 600;
  color: var(--t1);
  white-space: nowrap;
}

.depth2 {
  color: var(--t3);
  font-size: 12px;
  white-space: nowrap;
}

.func-name { font-weight: 500; }


/* ── 체크박스 버튼 ── */
.perm-check {
  width: 22px;
  height: 22px;
  border-radius: 4px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all var(--ease-fast);
  margin: 0 auto;
}

.perm-on {
  background: var(--green-pale);
  border: 2px solid var(--green);
}

.perm-off {
  background: var(--surface-2);
  border: 2px solid var(--t3);
}

.perm-off:hover { border-color: var(--t3); }

/* ── 잠금 상태 ── */
.perm-locked {
  background: color-mix(in srgb, var(--gold) 6%, var(--surface-2)) !important;
  border: 2px dashed var(--t4) !important;
  cursor: not-allowed !important;
  opacity: 1;
}

.lock-icon {
  color: var(--t4);
  flex-shrink: 0;
}

.row-locked td { background: var(--surface-2); opacity: 0.7; }
.row-locked:hover td { background: var(--surface-2) !important; }

.locked-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  margin-left: 10px;
  padding: 2px 8px;
  font-family: 'Barlow', sans-serif;
  font-size: 11px;
  font-weight: 600;
  color: var(--t3);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 4px;
  letter-spacing: 0.2px;
}

/* ── 매트릭스 푸터 ── */
.matrix-footer {
  padding: 12px 16px;
  font-family: 'Barlow', sans-serif;
  font-size: 12px;
  color: var(--t3);
  border-top: 1px solid var(--border);
  background: var(--surface-2);
}
</style>
