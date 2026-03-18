<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUiStore } from '@/stores/ui'
import { formatDate, formatNumber } from '@/utils/format'
import { ROUTE_NAMES } from '@/constants'
import { getWarehouseListSummary, getWarehouseList } from '@/api/wms'
import AppLayout from '@/components/layout/AppLayout.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'

const breadcrumb = [{ label: '창고 관리' }, { label: '전체 창고 현황' }]

const ui     = useUiStore()
const router = useRouter()

// ── 상태 ─────────────────────────────────────────────────────────────────────
const summaryCards = ref([])    // 상단 5개 요약 카드
const warehouses   = ref([])    // 창고 카드 그리드 + 관리자 테이블 공용
const viewMode     = ref('card') // 'card' | 'list'
const fetchedAt    = ref(null)
const errorMsg     = ref('')

// ── 헬퍼: 상태 → 배지 ────────────────────────────────────────────────────────
function statusBadgeClass(status) {
  const map = { ACTIVE: 'st-active', CAUTION: 'st-caution', INACTIVE: 'st-inactive' }
  return map[status] ?? 'st-inactive'
}

function statusLabel(status) {
  const map = { ACTIVE: '운영중', CAUTION: '주의', INACTIVE: '비활성' }
  return map[status] ?? '-'
}

// ── 헬퍼: 로케이션 가동률 → 색상 구간 ─────────────────────────────────────────
// < 60%: low(green) / 60~80%: mid(amber) / > 80%: high(red)
function utilClass(pct) {
  if (pct < 60) return 'low'
  if (pct <= 80) return 'mid'
  return 'high'
}

// ── 라우터 이동 ───────────────────────────────────────────────────────────────
function goDetail(warehouseId) {
  router.push({ name: ROUTE_NAMES.MASTER_WAREHOUSE_DETAIL, params: { id: warehouseId } })
}

function goRegister() {
  router.push({ name: ROUTE_NAMES.MASTER_WAREHOUSE_REGISTER })
}

function goAccountInvite() {
  router.push({ name: ROUTE_NAMES.MASTER_ACCOUNT_INVITE })
}

// ── 데이터 fetch ──────────────────────────────────────────────────────────────
async function fetchWarehouseList() {
  errorMsg.value = ''
  ui.setLoading(true)
  try {
    const [summaryRes, listRes] = await Promise.all([
      getWarehouseListSummary(),
      getWarehouseList(),
    ])
    const s     = summaryRes.data.data
    const today = new Date()
    fetchedAt.value = today
    const todayStr  = formatDate(today, 'date').replace(/-/g, '.')

    summaryCards.value = [
      { id: 1, label: '등록 창고',           value: s.totalCount,                   unit: '',   sub: '전체 운영 창고 수',      color: '' },
      { id: 2, label: '활성 창고',           value: s.activeCount,                  unit: '',   sub: '정상 운영 중',           color: 'var(--green)' },
      { id: 3, label: '총 재고',             value: formatNumber(s.totalInventory), unit: 'EA', sub: '전 창고 합산 보관 수량',  color: '' },
      { id: 4, label: '금일 출고 건',         value: s.todayOutbound,                unit: '건', sub: todayStr + ' 기준',      color: 'var(--blue)' },
      { id: 5, label: '평균 로케이션 가동률',  value: s.avgLocationUtil + '%',        unit: '',   sub: '창고 공간 효율',         color: 'var(--gold)', small: true },
    ]
    warehouses.value = listRes.data.data
  } catch (err) {
    errorMsg.value = '데이터를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.'
    console.error('[WarehouseList] fetchWarehouseList error:', err)
  } finally {
    ui.setLoading(false)
  }
}

onMounted(fetchWarehouseList)
</script>

<template>
  <AppLayout :breadcrumb="breadcrumb" title="창고 목록">
    <!-- 헤더 액션 버튼 (AppLayout #header-action 슬롯) -->
    <template #header-action>
      <button class="ui-btn ui-btn--ghost btn-report">
        <svg fill="none" height="14" viewBox="0 0 14 14" width="14">
          <path d="M7 1v8M3.5 6.5L7 10l3.5-3.5" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"/>
          <path d="M1.5 11v1.5h11V11" stroke="currentColor" stroke-linecap="round" stroke-width="1.5"/>
        </svg>
        리포트 다운로드
      </button>
      <button class="ui-btn btn-wh-register" @click="goRegister">
        <svg fill="none" height="14" viewBox="0 0 14 14" width="14">
          <line stroke="currentColor" stroke-linecap="round" stroke-width="2" x1="7" x2="7" y1="2" y2="12"/>
          <line stroke="currentColor" stroke-linecap="round" stroke-width="2" x1="2" x2="12" y1="7" y2="7"/>
        </svg>
        신규 창고 등록
      </button>
    </template>

    <LoadingSpinner v-if="ui.isLoading" fullscreen />

  <div class="wl-page">

    <!-- 에러 배너 -->
    <div v-if="errorMsg" class="error-banner">{{ errorMsg }}</div>

    <!-- 상단 요약 카드 5개 -->
    <div class="summary-row">
      <div v-for="(card, id) in summaryCards" :key="id" class="summary-card">
        <span class="summary-label">{{ card.label }}</span>
        <span
          class="summary-value"
          :class="{ 'summary-value--sm': card.small }"
          :style="card.color ? { color: card.color } : {}"
        >{{ card.value }}</span>
        <span class="summary-sub">{{ card.sub }}</span>
      </div>
    </div>

    <!-- 섹션 헤더 + 뷰 토글 -->
    <div class="section-header">
      <span class="section-title">창고별 현황</span>
      <div class="view-toggle">
        <button
          :class="['view-btn', { active: viewMode === 'card' }]"
          title="카드 뷰"
          @click="viewMode = 'card'"
        >
          <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.4">
            <rect x="1" y="1" width="5" height="5" rx="0.5"/>
            <rect x="8" y="1" width="5" height="5" rx="0.5"/>
            <rect x="1" y="8" width="5" height="5" rx="0.5"/>
            <rect x="8" y="8" width="5" height="5" rx="0.5"/>
          </svg>
        </button>
        <button
          :class="['view-btn', { active: viewMode === 'list' }]"
          title="리스트 뷰"
          @click="viewMode = 'list'"
        >
          <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round">
            <line x1="1" y1="3" x2="13" y2="3"/>
            <line x1="1" y1="7" x2="13" y2="7"/>
            <line x1="1" y1="11" x2="13" y2="11"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- ── 카드 그리드 (viewMode === 'card') ── -->
    <div v-if="viewMode === 'card'" class="wh-card-grid">
      <div
        v-for="wh in warehouses"
        :key="wh.id"
        :class="['wh-card', { 'wh-card--inactive': wh.status === 'INACTIVE' }]"
        @click="goDetail(wh.id)"
      >
        <!-- 카드 상단: 창고 코드 / 이름 / 위치 / 상태 배지 -->
        <div class="wh-card-top">
          <div class="wh-card-left">
            <span class="wh-code">{{ wh.code }}</span>
            <span class="wh-name">{{ wh.name }}</span>
            <div class="wh-loc">
              <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round">
                <path d="M6 1C4.3 1 3 2.3 3 4c0 2.7 3 6 3 6s3-3.3 3-6c0-1.7-1.3-3-3-3z"/>
                <circle cx="6" cy="4" r="1"/>
              </svg>
              {{ wh.location }}
            </div>
          </div>
          <span :class="['wh-status-badge', statusBadgeClass(wh.status)]">
            <span class="wh-status-dot"></span>
            {{ statusLabel(wh.status) }}
          </span>
        </div>

        <!-- 카드 통계 4개 -->
        <div class="wh-card-stats">
          <div class="wh-stat">
            <span class="wh-stat-label">재고</span>
            <span class="wh-stat-value">{{ formatNumber(wh.stats.inventory) }}</span>
            <span class="wh-stat-unit">EA</span>
          </div>
          <div class="wh-stat">
            <span class="wh-stat-label">금일 출고</span>
            <span class="wh-stat-value" style="color: var(--blue)">{{ wh.stats.todayOutbound }}</span>
            <span class="wh-stat-unit">건</span>
          </div>
          <div class="wh-stat">
            <span class="wh-stat-label">입고 예정</span>
            <span class="wh-stat-value" style="color: var(--gold)">{{ wh.stats.pendingAsn }}</span>
            <span class="wh-stat-unit">ASN</span>
          </div>
          <div class="wh-stat">
            <span class="wh-stat-label">셀러</span>
            <span class="wh-stat-value">{{ wh.stats.sellerCount }}</span>
            <span class="wh-stat-unit">개</span>
          </div>
        </div>

        <!-- 카드 푸터: 로케이션 가동률 + 상세 보기 -->
        <div class="wh-card-footer">
          <div class="wh-util-track">
            <span class="util-caption">로케이션</span>
            <div class="util-bar">
              <div
                :class="['util-fill', wh.status !== 'INACTIVE' ? utilClass(wh.locationUtil) : 'low']"
                :style="{ width: wh.locationUtil + '%' }"
              ></div>
            </div>
            <span
              :class="['util-pct-label', wh.status !== 'INACTIVE' ? utilClass(wh.locationUtil) : '']"
              :style="wh.status === 'INACTIVE' ? 'color: var(--t4)' : ''"
            >
              {{ wh.status !== 'INACTIVE' ? wh.locationUtil + '%' : '-' }}
            </span>
          </div>
          <span class="wh-detail-link">
            상세 보기
            <svg viewBox="0 0 12 12" fill="none" stroke="var(--gold)" stroke-width="1.6" stroke-linecap="round">
              <path d="M3 6h6M7 4l2 2-2 2"/>
            </svg>
          </span>
        </div>
      </div>
    </div>

    <!-- ── 리스트 뷰 (viewMode === 'list') ── -->
    <div v-else class="wh-list-section">
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>창고</th>
              <th>상태</th>
              <th class="th-right">재고(EA)</th>
              <th class="th-right">금일 출고</th>
              <th class="th-right">입고 예정</th>
              <th class="th-right">셀러 수</th>
              <th>로케이션 가동률</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="wh in warehouses"
              :key="wh.id"
              :class="{ 'wh-list-row--inactive': wh.status === 'INACTIVE' }"
            >
              <!-- 창고명: code 태그 + 이름 + 위치 -->
              <td>
                <div class="wl-name-col">
                  <span class="wh-id-tag">{{ wh.code }}</span>
                  <span class="wl-name">{{ wh.name }}</span>
                  <span class="wl-loc">{{ wh.location }}</span>
                </div>
              </td>
              <!-- 상태 배지 -->
              <td>
                <span :class="['wh-status-badge', statusBadgeClass(wh.status)]">
                  <span class="wh-status-dot"></span>
                  {{ statusLabel(wh.status) }}
                </span>
              </td>
              <!-- 재고 -->
              <td class="td-right">
                <span v-if="wh.status !== 'INACTIVE'" class="list-num">
                  {{ formatNumber(wh.stats.inventory) }}<em class="list-unit">EA</em>
                </span>
                <span v-else class="cell-empty">-</span>
              </td>
              <!-- 금일 출고 -->
              <td class="td-right">
                <span v-if="wh.status !== 'INACTIVE'" class="list-num">
                  {{ wh.stats.todayOutbound }}<em class="list-unit">건</em>
                </span>
                <span v-else class="cell-empty">-</span>
              </td>
              <!-- 입고 예정 (ASN) -->
              <td class="td-right">
                <span v-if="wh.status !== 'INACTIVE'" class="list-num">
                  {{ wh.stats.pendingAsn }}<em class="list-unit">건</em>
                </span>
                <span v-else class="cell-empty">-</span>
              </td>
              <!-- 셀러 수 -->
              <td class="td-right">
                <span v-if="wh.status !== 'INACTIVE'" class="list-num">
                  {{ wh.stats.sellerCount }}<em class="list-unit">개</em>
                </span>
                <span v-else class="cell-empty">-</span>
              </td>
              <!-- 로케이션 가동률 -->
              <td>
                <div v-if="wh.status !== 'INACTIVE'" class="list-util-track">
                  <div class="list-util-bar">
                    <div
                      class="util-fill"
                      :class="utilClass(wh.locationUtil)"
                      :style="{ width: wh.locationUtil + '%' }"
                    />
                  </div>
                  <span :class="['util-pct-label', utilClass(wh.locationUtil)]">
                    {{ wh.locationUtil }}%
                  </span>
                </div>
                <span v-else class="cell-empty">-</span>
              </td>
              <!-- 액션 -->
              <td>
                <button class="action-btn" @click="goDetail(wh.id)">상세보기</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ── 창고별 관리자 현황 테이블 ── -->
    <div class="table-section">
      <div class="table-section-header">
        <span class="table-section-title">창고별 관리자 현황</span>
        <button class="action-btn action-btn--primary" @click="goAccountInvite">+ 관리자 배정</button>
      </div>
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>창고</th>
              <th>창고 코드</th>
              <th>담당 관리자</th>
              <th>이메일</th>
              <th>연락처</th>
              <th>마지막 로그인</th>
              <th>상태</th>
              <th>액션</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="wh in warehouses" :key="'mgr-' + wh.id">
              <!-- 창고명 -->
              <td>
                <span :class="['wh-name-cell', { 'wh-name-cell--inactive': wh.status === 'INACTIVE' }]">
                  {{ wh.name }}
                </span>
              </td>
              <!-- 창고 코드 -->
              <td><span class="wh-id-tag">{{ wh.code }}</span></td>
              <!-- 담당 관리자 -->
              <td>
                <span v-if="wh.manager" class="mgr-name">{{ wh.manager.name }}</span>
                <span v-else class="mgr-unassigned">미배정</span>
              </td>
              <!-- 이메일 -->
              <td>
                <span v-if="wh.manager" class="mgr-mono">{{ wh.manager.email }}</span>
                <span v-else class="cell-empty">-</span>
              </td>
              <!-- 연락처 -->
              <td>
                <span v-if="wh.manager" class="mgr-mono">{{ wh.manager.phone }}</span>
                <span v-else class="cell-empty">-</span>
              </td>
              <!-- 마지막 로그인 -->
              <td>
                <span
                  v-if="wh.manager"
                  :class="['mgr-login', { 'mgr-login--caution': wh.manager.status === 'CAUTION' }]"
                >{{ wh.manager.lastLogin }}</span>
                <span v-else class="cell-empty">-</span>
              </td>
              <!-- 상태 배지 -->
              <td>
                <span
                  v-if="wh.manager"
                  :class="['wh-status-badge', statusBadgeClass(wh.manager.status)]"
                >
                  <span class="wh-status-dot"></span>
                  {{ statusLabel(wh.manager.status) }}
                </span>
                <span v-else class="wh-status-badge st-inactive">
                  <span class="wh-status-dot"></span>비활성
                </span>
              </td>
              <!-- 액션 버튼 -->
              <td>
                <div class="action-group">
                  <template v-if="wh.manager">
                    <button class="action-btn">비밀번호 초기화</button>
                    <button class="action-btn action-btn--primary">상세</button>
                  </template>
                  <template v-else>
                    <button class="action-btn action-btn--primary" @click.stop="goAccountInvite">
                      관리자 배정
                    </button>
                  </template>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

  </div>
  </AppLayout>
</template>

<style scoped>
/* ── 헤더 슬롯 버튼 오버라이드 (AppLayout ui-btn 기반) ───────────────────── */
/* Dashboard.vue의 .btn-export / .btn-gold 패턴과 동일 */
.btn-report {
  border-radius: var(--radius-sm);
  font-family: var(--font-barlow);
  font-weight: 500;
}
.btn-report svg {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}

.btn-wh-register {
  border-radius: var(--radius-sm);
  background: var(--gold);
  font-family: var(--font-barlow);
  font-weight: 700;
  color: var(--t1);
  border: none;
}
.btn-wh-register:hover { background: var(--gold-lt); }
.btn-wh-register svg {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}

/* ── 페이지 래퍼 ──────────────────────────────────────────────────────────── */
.wl-page {
  display: flex;
  flex-direction: column;
  gap: var(--space-8);
}

/* ── 에러 배너 ───────────────────────────────────────────────────────────── */
.error-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  padding: var(--space-3) var(--space-5);
  background: rgba(220, 38, 38, 0.08);
  border: 1px solid var(--red);
  border-radius: var(--radius-md);
  color: var(--red);
  font-size: var(--font-size-sm);
}

/* ── 요약 카드 5개 ────────────────────────────────────────────────────────── */
.summary-row {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: var(--space-5);
}

.summary-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 20px 24px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.summary-label {
  font-family: 'Barlow', sans-serif;
  font-weight: 600;
  font-size: 10px;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  color: var(--t3);
}

.summary-value {
  font-family: 'Barlow Condensed', sans-serif;
  font-weight: 700;
  font-size: 36px;
  line-height: 1;
  color: var(--t1);
}
.summary-value--sm { font-size: 30px; }

.summary-sub {
  font-family: 'Inter', sans-serif;
  font-size: 11px;
  color: var(--t3);
}

/* ── 섹션 헤더 + 뷰 토글 ─────────────────────────────────────────────────── */
.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.section-title {
  font-family: 'Barlow Condensed', sans-serif;
  font-weight: 700;
  font-size: 18px;
  letter-spacing: 0.5px;
  color: var(--t1);
}

.view-toggle { display: flex; gap: 4px; }

.view-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--surface);
  cursor: pointer;
  transition: background var(--ease-fast), border-color var(--ease-fast);
}
.view-btn svg { width: 14px; height: 14px; color: var(--t3); }
.view-btn.active { background: var(--t1); border-color: var(--t1); }
.view-btn.active svg { color: #fff; }

/* ── 창고 카드 그리드 ────────────────────────────────────────────────────── */
.wh-card-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-5);
}

.wh-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  overflow: hidden;
  cursor: pointer;
  transition: box-shadow var(--ease-default), border-color var(--ease-default);
  display: flex;
  flex-direction: column;
}
.wh-card:hover {
  border-color: var(--gold);
  box-shadow: 0 4px 20px rgba(245, 166, 35, 0.12);
}
.wh-card--inactive { opacity: 0.65; }

/* 카드 상단 */
.wh-card-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 20px 22px 16px;
  border-bottom: 1px solid var(--border);
}

.wh-card-left {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.wh-code {
  font-family: 'IBM Plex Sans', monospace;
  font-size: 11px;
  color: var(--t3);
}

.wh-name {
  font-family: 'Barlow Condensed', sans-serif;
  font-weight: 700;
  font-size: 22px;
  color: var(--t1);
  letter-spacing: 0.3px;
}

.wh-loc {
  display: flex;
  align-items: center;
  gap: 5px;
  font-family: 'Barlow', sans-serif;
  font-size: 12px;
  color: var(--t3);
}
.wh-loc svg { width: 12px; height: 12px; flex-shrink: 0; }

/* 상태 배지 */
.wh-status-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 11px;
  border-radius: var(--radius-full);
  font-family: 'Inter', sans-serif;
  font-size: 11px;
  font-weight: 600;
  flex-shrink: 0;
  white-space: nowrap;
}
.wh-status-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: currentColor;
}
.st-active   { background: var(--green-pale); color: var(--green); }
.st-caution  { background: var(--amber-pale); color: #92400E; }
.st-inactive { background: var(--border);     color: var(--t3); }

/* 카드 통계 4개 */
.wh-card-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
}

.wh-stat {
  padding: 14px 18px;
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.wh-stat:last-child { border-right: none; }

.wh-stat-label {
  font-family: 'Barlow', sans-serif;
  font-weight: 600;
  font-size: 10px;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: var(--t4);
}

.wh-stat-value {
  font-family: 'Barlow Condensed', sans-serif;
  font-weight: 700;
  font-size: 24px;
  color: var(--t1);
  line-height: 1;
}

.wh-stat-unit {
  font-family: 'Barlow', sans-serif;
  font-size: 11px;
  color: var(--t3);
}

/* 카드 푸터 */
.wh-card-footer {
  padding: 12px 22px;
  background: var(--surface-2);
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-top: 1px solid var(--border);
  margin-top: auto;
}

.wh-util-track {
  display: flex;
  align-items: center;
  gap: 8px;
}

.util-bar {
  width: 120px;
  height: 5px;
  background: var(--border);
  border-radius: 3px;
  overflow: hidden;
}

.util-fill {
  height: 100%;
  border-radius: 3px;
}
.util-fill.low  { background: var(--green); }
.util-fill.mid  { background: var(--gold); }
.util-fill.high { background: var(--red); }

.util-pct-label {
  font-family: 'Inter', sans-serif;
  font-weight: 600;
  font-size: 12px;
}
.util-pct-label.low  { color: var(--green); }
.util-pct-label.mid  { color: #92400E; }
.util-pct-label.high { color: var(--red); }

.util-caption {
  font-family: 'Barlow', sans-serif;
  font-size: 11px;
  color: var(--t4);
}

.wh-detail-link {
  display: flex;
  align-items: center;
  gap: 4px;
  font-family: 'Barlow', sans-serif;
  font-weight: 600;
  font-size: 12px;
  color: var(--gold);
}
.wh-detail-link svg { width: 12px; height: 12px; }

/* ── 리스트 뷰 ───────────────────────────────────────────────────────────── */
.wh-list-section {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  overflow: hidden;
}

/* INACTIVE 창고 행 — 흐리게 */
.wh-list-row--inactive td { opacity: 0.45; }

/* 창고 이름 컬럼 */
.wl-name-col {
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.wl-name {
  font-family: 'Barlow', sans-serif;
  font-weight: 600;
  font-size: 14px;
  color: var(--t1);
}
.wl-loc {
  font-family: 'Inter', sans-serif;
  font-size: 11px;
  color: var(--t3);
}

/* 숫자 셀 우측 정렬 */
.th-right { text-align: right; }
.td-right { text-align: right; }

/* 숫자 값 + 단위 */
.list-num {
  font-family: var(--font-condensed), sans-serif;
  font-weight: 700;
  font-size: 15px;
  color: var(--t1);
}
.list-unit {
  font-family: 'Inter', sans-serif;
  font-style: normal;
  font-size: 10px;
  color: var(--t3);
  margin-left: 2px;
}

/* 인라인 가동률 바 */
.list-util-track {
  display: flex;
  align-items: center;
  gap: 8px;
}
.list-util-bar {
  width: 80px;
  height: 5px;
  background: var(--border);
  border-radius: 3px;
  overflow: hidden;
}

/* ── 관리자 현황 테이블 ───────────────────────────────────────────────────── */
.table-section {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.table-section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 22px;
  border-bottom: 1px solid var(--border);
  background: var(--surface);
}

.table-section-title {
  font-family: 'Barlow Condensed', sans-serif;
  font-weight: 700;
  font-size: 16px;
  color: var(--t1);
}

/* 가로 스크롤 대응 */
.table-wrap { overflow-x: auto; }

.data-table {
  width: 100%;
  border-collapse: collapse;
  white-space: nowrap;
}

.data-table thead tr {
  background: var(--surface-2);
  border-bottom: 1px solid var(--border);
}

.data-table th {
  padding: 11px 16px;
  font-family: 'Barlow', sans-serif;
  font-weight: 600;
  font-size: 10px;
  letter-spacing: 1.2px;
  text-transform: uppercase;
  color: var(--t3);
  text-align: left;
}

.data-table td {
  padding: 13px 16px;
  font-family: 'Barlow', sans-serif;
  font-size: 13px;
  color: var(--t2);
  border-bottom: 1px solid var(--border);
  vertical-align: middle;
}

.data-table tbody tr:last-child td { border-bottom: none; }
.data-table tbody tr:hover td {
  background: var(--surface-2);
  cursor: default;
}

/* 테이블 셀 컴포넌트 */
.wh-name-cell {
  font-weight: 600;
  font-size: 14px;
  color: var(--t1);
}
.wh-name-cell--inactive { color: var(--t3); }

.wh-id-tag {
  font-family: 'IBM Plex Sans', monospace;
  font-size: 11px;
  color: var(--blue);
  background: var(--blue-pale);
  padding: 2px 7px;
  border-radius: 3px;
}

.mgr-name {
  font-weight: 600;
  font-size: 14px;
  color: var(--t1);
}

.mgr-unassigned {
  color: var(--t4);
  font-size: 13px;
  font-style: italic;
}

.mgr-mono {
  font-family: 'IBM Plex Sans', sans-serif;
  font-size: 12px;
  color: var(--t2);
}

.mgr-login {
  font-family: 'Inter', sans-serif;
  font-size: 12px;
  color: var(--t3);
}
.mgr-login--caution {
  color: var(--gold);
  font-weight: 600;
}

.cell-empty {
  color: var(--t4);
  font-size: 13px;
}

/* 액션 버튼 */
.action-group {
  display: flex;
  gap: 6px;
}

.action-btn {
  display: inline-flex;
  align-items: center;
  padding: 4px 11px;
  height: 26px;
  border-radius: 3px;
  font-family: 'Barlow', sans-serif;
  font-weight: 600;
  font-size: 11px;
  cursor: pointer;
  background: transparent;
  border: 1px solid var(--border);
  color: var(--t2);
  transition: border-color var(--ease-fast), color var(--ease-fast);
}
.action-btn:hover { border-color: var(--border-dk); color: var(--t1); }

.action-btn--primary {
  border-color: var(--gold);
  color: var(--gold);
}
.action-btn--primary:hover {
  border-color: var(--gold-lt);
  color: var(--gold-lt);
}
</style>
