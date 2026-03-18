<script setup>
import { computed, reactive, ref } from 'vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import BaseModal from '@/components/common/BaseModal.vue'
import BaseForm from '@/components/common/BaseForm.vue'

const breadcrumb = [{ label: 'CONK' }, { label: '시스템 관리자' }, { label: '판매 채널 수수료율 설정' }]

const channelTabs = ['Amazon', 'Walmart', 'Shopify']
const activeTab = ref('Amazon')
const revisionModalOpen = ref(false)
const saveModalOpen = ref(false)

const revisionForm = reactive({ effectiveDate: '2026-04-01' })

const summaryCards = [
  { label: '활성 프로필 수', value: 18, sub: '채널/국가 조합 기준 운영중' },
  { label: '오늘 개정 건수', value: 3, sub: '리비전 대기 1건 포함' },
  { label: '표준 요율 직전 매핑', value: 41, sub: '시뮬레이터 반영 기준' },
  { label: '차기 개정 예정', value: '04/01', sub: '아마존 미국 리비전 조정예정' },
]

const profiles = {
  Amazon: {
    profileName: 'Amazon US 기본 요율',
    countries: '미국, 캐나다',
    companyCount: '24개',
    approver: '플랫폼 운영 관리자',
    lastRevisedAt: '3/08',
    rows: [
      { id: 1, range: 'US · $0 ~ $30', baseRate: 12.5, minFee: 2.8, addFee: 0.65, returnFee: 1.2, status: '운영중' },
      { id: 2, range: 'US · $30 ~ $80', baseRate: 10.8, minFee: 3.5, addFee: 0.8, returnFee: 1.6, status: '운영중' },
      { id: 3, range: 'US · $80 이상', baseRate: 9.2, minFee: 4.3, addFee: 1.1, returnFee: 1.8, status: '검토중' },
      { id: 4, range: 'CA · 전체 구간', baseRate: 11.4, minFee: 3.1, addFee: 0.75, returnFee: 1.35, status: '적용전' },
    ],
  },
  Walmart: {
    profileName: 'Walmart US 표준',
    countries: '미국',
    companyCount: '11개',
    approver: '요율 운영 담당자',
    lastRevisedAt: '3/05',
    rows: [
      { id: 1, range: 'US · 전체 구간', baseRate: 13.4, minFee: 2.4, addFee: 0.55, returnFee: 1.0, status: '운영중' },
    ],
  },
  Shopify: {
    profileName: 'Shopify 결제 수수료 기본',
    countries: '글로벌',
    companyCount: '32개',
    approver: '플랫폼 운영 관리자',
    lastRevisedAt: '2/21',
    rows: [
      { id: 1, range: '카드 결제', baseRate: 2.9, minFee: 0.3, addFee: 0, returnFee: 0, status: '운영중' },
      { id: 2, range: '기타 결제', baseRate: 3.2, minFee: 0.3, addFee: 0, returnFee: 0, status: '적용전' },
    ],
  },
}

const currentProfile = computed(() => profiles[activeTab.value])

function statusClass(status) {
  return {
    'fee-status fee-status--green': status === '운영중',
    'fee-status fee-status--amber': status === '검토중',
    'fee-status fee-status--blue': status === '적용전',
  }
}
</script>

<template>
  <AppLayout :breadcrumb="breadcrumb" title="판매 채널 수수료율 설정">
    <template #header-action>
      <button class="ui-btn ui-btn--ghost">CSV 내보내기</button>
      <button class="ui-btn btn-gold" @click="revisionModalOpen = true">+ 개정안 생성</button>
    </template>

    <section class="summary-grid">
      <article v-for="card in summaryCards" :key="card.label" class="summary-card">
        <p class="summary-label">{{ card.label }}</p>
        <strong class="summary-value">{{ card.value }}</strong>
        <p class="summary-sub">{{ card.sub }}</p>
      </article>
    </section>

    <section class="layout-grid">
      <article class="main-card">
        <div class="section-head section-head--stack">
          <div>
            <h2>채널별 기본 수수료 프로필</h2>
            <p>국가별 주문 금액 구간별로 플랫폼 표준 수수료를 관리합니다.</p>
          </div>
          <div class="tab-row">
            <button
              v-for="tab in channelTabs"
              :key="tab"
              :class="['tab-btn', { active: activeTab === tab }]"
              @click="activeTab = tab"
            >
              {{ tab }}
            </button>
          </div>
        </div>

        <div class="profile-banner">
          <div>
            <h3>{{ currentProfile.profileName }}</h3>
            <p>플랫폼 표준 프로필로 저장되며 선택 채널의 셀러 마진 계산에 자동 반영됩니다.</p>
          </div>
          <div class="banner-metrics">
            <div>
              <span>연결 업체</span>
              <strong>{{ currentProfile.companyCount }}</strong>
            </div>
            <div>
              <span>최근 개정</span>
              <strong>{{ currentProfile.lastRevisedAt }}</strong>
            </div>
          </div>
        </div>

        <div class="table-wrap">
          <table class="fee-table">
            <thead>
              <tr>
                <th>시장 / 주문 구간</th>
                <th>기본 수수료율</th>
                <th>최소 수수료</th>
                <th>택배비 추가</th>
                <th>반품 처리 수수료</th>
                <th>상태</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in currentProfile.rows" :key="row.id">
                <td class="range-cell">{{ row.range }}</td>
                <td>
                  <input v-model="row.baseRate" type="number" />
                  <span class="unit">%</span>
                </td>
                <td>
                  <input v-model="row.minFee" type="number" />
                  <span class="unit">USD</span>
                </td>
                <td>
                  <input v-model="row.addFee" type="number" />
                  <span class="unit">USD</span>
                </td>
                <td>
                  <input v-model="row.returnFee" type="number" />
                  <span class="unit">USD</span>
                </td>
                <td>
                  <span :class="statusClass(row.status)">{{ row.status }}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="bottom-actions">
          <button class="ui-btn ui-btn--ghost">입력 취소</button>
          <button class="ui-btn btn-gold" @click="saveModalOpen = true">저장</button>
        </div>
      </article>

      <aside class="side-column">
        <article class="side-card">
          <h3>현재 프로필 요약</h3>
          <dl class="side-list">
            <div>
              <dt>프로필 코드</dt>
              <dd>AMZ-US-STD</dd>
            </div>
            <div>
              <dt>적용 국가</dt>
              <dd>{{ currentProfile.countries }}</dd>
            </div>
            <div>
              <dt>연결 업체 수</dt>
              <dd>{{ currentProfile.companyCount }}</dd>
            </div>
            <div>
              <dt>최종 승인자</dt>
              <dd>{{ currentProfile.approver }}</dd>
            </div>
          </dl>
        </article>

        <article class="side-card">
          <h3>최근 개정 이력</h3>
          <ul class="history-list">
            <li>2026-03-08 · Amazon US 최소 수수료 조정</li>
            <li>2026-02-19 · Walmart US 프로필 분리</li>
            <li>2026-01-26 · Shopify 기본 프로필 초안 생성</li>
          </ul>
        </article>

        <article class="side-card guide-card">
          <h3>운영 가이드</h3>
          <p>
            수수료 개정 시 변경된 값이 즉시 저장되지 않고, 프로필 초안 작성 후 승인 프로세스로 관리하는 것을 권장합니다.
          </p>
        </article>
      </aside>
    </section>

    <BaseModal
      :is-open="revisionModalOpen"
      title="수수료 개정안 생성"
      width="520px"
      @cancel="revisionModalOpen = false"
      @confirm="revisionModalOpen = false"
    >
      <div class="modal-box">
        <p class="modal-guide">
          현재 프로필을 기준으로 새 개정안을 만들면 승인 전까지는 초안 상태로 유지됩니다.
        </p>
        <div class="modal-summary-grid">
          <div>
            <span>기준 프로필</span>
            <strong>{{ currentProfile.profileName }}</strong>
          </div>
          <div>
            <span>적용 대상</span>
            <strong>{{ currentProfile.countries }} / {{ currentProfile.companyCount }}</strong>
          </div>
        </div>
        <BaseForm label="시행 예정일" required>
          <input v-model="revisionForm.effectiveDate" type="date" />
        </BaseForm>
      </div>
    </BaseModal>

    <BaseModal
      :is-open="saveModalOpen"
      title="채널 수수료율 저장 확인"
      width="520px"
      @cancel="saveModalOpen = false"
      @confirm="saveModalOpen = false"
    >
      <div class="modal-box">
        <p class="modal-guide">
          저장된 수수료율은 다음 정산 배치 시점부터 적용되며, 현재 값을 덮어써 변경 이력이 남습니다.
        </p>
        <div class="modal-summary-grid">
          <div>
            <span>저장 대상 프로필</span>
            <strong>{{ currentProfile.profileName }}</strong>
          </div>
          <div>
            <span>최종 승인자</span>
            <strong>{{ currentProfile.approver }}</strong>
          </div>
        </div>
      </div>
    </BaseModal>
  </AppLayout>
</template>

<style scoped>
.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
  margin-bottom: 16px;
}

.summary-card,
.main-card,
.side-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
}

.summary-card {
  padding: 20px 22px;
}

.summary-label {
  margin: 0 0 10px;
  color: var(--t3);
  font-size: var(--font-size-xs);
}

.summary-value {
  display: block;
  font-size: 32px;
  line-height: 1;
}

.summary-sub {
  margin: 10px 0 0;
  color: var(--t3);
  font-size: var(--font-size-xs);
}

.layout-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 300px;
  gap: 18px;
}

.main-card {
  padding: 18px;
}

.section-head {
  margin-bottom: 16px;
}

.section-head h2,
.profile-banner h3,
.side-card h3 {
  margin: 0;
}

.section-head p,
.profile-banner p {
  margin: 6px 0 0;
  color: var(--t3);
  font-size: var(--font-size-sm);
}

.section-head--stack {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.tab-row {
  display: flex;
  gap: 8px;
}

.tab-btn {
  height: 34px;
  padding: 0 14px;
  border-radius: 999px;
  border: 1px solid var(--border);
  background: #fff;
  color: var(--t3);
  font-weight: 700;
}

.tab-btn.active {
  border-color: var(--gold);
  background: var(--gold);
  color: #2a1a00;
}

.profile-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 18px;
  border-radius: var(--radius-md);
  background: #fffdf5;
  border: 1px solid #f2e8c8;
  margin-bottom: 16px;
}

.banner-metrics {
  display: flex;
  gap: 12px;
}

.banner-metrics div {
  min-width: 92px;
  padding: 10px 12px;
  border-radius: var(--radius-md);
  background: #fff;
}

.banner-metrics span,
.modal-summary-grid span {
  display: block;
  color: var(--t3);
  font-size: var(--font-size-xs);
  margin-bottom: 6px;
}

.banner-metrics strong,
.modal-summary-grid strong {
  color: var(--t1);
}

.table-wrap {
  overflow-x: auto;
}

.fee-table {
  width: 100%;
  border-collapse: collapse;
}

.fee-table th,
.fee-table td {
  padding: 12px 10px;
  border-bottom: 1px solid var(--border);
  text-align: left;
  vertical-align: middle;
}

.fee-table th {
  background: var(--surface-2);
  color: var(--t3);
  font-size: var(--font-size-xs);
}

.fee-table td input {
  width: 92px;
  height: 36px;
  padding: 0 10px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
}

.range-cell {
  font-weight: 700;
}

.unit {
  margin-left: 8px;
  color: var(--t3);
  font-size: var(--font-size-xs);
}

.fee-status {
  display: inline-flex;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: var(--font-size-xs);
  font-weight: 700;
}

.fee-status--green {
  background: var(--green-pale);
  color: var(--green);
}

.fee-status--amber {
  background: var(--gold-pale);
  color: #b45309;
}

.fee-status--blue {
  background: var(--blue-pale);
  color: var(--blue);
}

.bottom-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 16px;
}

.side-column {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.side-card {
  padding: 18px;
}

.side-list {
  display: grid;
  gap: 10px;
  margin: 14px 0 0;
}

.side-list div {
  padding: 12px 14px;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
}

.side-list dt {
  margin-bottom: 6px;
  color: var(--t3);
  font-size: var(--font-size-xs);
}

.side-list dd {
  margin: 0;
  font-weight: 700;
}

.history-list {
  margin: 12px 0 0;
  padding-left: 18px;
  color: var(--t2);
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.guide-card p,
.modal-guide {
  margin: 0;
  padding: 14px;
  border-radius: var(--radius-md);
  background: #f3f5ff;
  color: #4654c6;
  line-height: 1.5;
  font-size: var(--font-size-sm);
}

.modal-box {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.modal-summary-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.modal-summary-grid div {
  padding: 12px 14px;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
}

@media (max-width: 1200px) {
  .summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .layout-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .section-head--stack,
  .profile-banner {
    flex-direction: column;
    align-items: flex-start;
  }

  .modal-summary-grid {
    grid-template-columns: 1fr;
  }
}
</style>
