<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import {
  addWorkerStateListeners,
  createInventoryRows,
  loadWorkerState,
} from '@/utils/whWorkerState'

const breadcrumb = [{ label: 'WH Worker' }, { label: '재고 관리' }]
const FILTERS = ['전체', '반영 완료', '반영 대기']

const inventoryRows = ref([])
const currentFilter = ref('전체')

function syncInventoryState() {
  inventoryRows.value = createInventoryRows(loadWorkerState())
}

const counts = computed(() => ({
  all: inventoryRows.value.length,
  reflected: inventoryRows.value.filter((row) => row.reflected).length,
  pending: inventoryRows.value.filter((row) => !row.reflected).length,
  quantity: inventoryRows.value.filter((row) => row.reflected).reduce((sum, row) => sum + row.putQty, 0),
}))

const summaryCards = computed(() => [
  { key: 'all', label: '전체 재고 행', value: `${counts.value.all}건`, desc: '입고 작업 기준 표시', tone: 'blue' },
  { key: 'reflected', label: '반영 완료', value: `${counts.value.reflected}건`, desc: '적재 완료 후 재고 활성', tone: 'green' },
  { key: 'pending', label: '반영 대기', value: `${counts.value.pending}건`, desc: '검수 후 적재 대기 포함', tone: 'amber' },
  { key: 'quantity', label: '활성 수량', value: `${counts.value.quantity}개`, desc: '실제 반영된 적재 수량', tone: 'purple' },
])

const filteredRows = computed(() => {
  if (currentFilter.value === '반영 완료') return inventoryRows.value.filter((row) => row.reflected)
  if (currentFilter.value === '반영 대기') return inventoryRows.value.filter((row) => !row.reflected)
  return inventoryRows.value
})

function inventoryStatusClass(status) {
  return status === '반영 완료' ? 'status-chip status-chip--green' : 'status-chip status-chip--amber'
}

let removeListeners = () => {}

onMounted(() => {
  syncInventoryState()
  removeListeners = addWorkerStateListeners(syncInventoryState)
})

onBeforeUnmount(() => {
  removeListeners()
})
</script>

<template>
  <AppLayout title="재고 관리" :breadcrumb="breadcrumb">
    <template #header-action>
      <button class="ui-btn ui-btn--ghost" @click="currentFilter = currentFilter === '전체' ? '반영 완료' : '전체'">
        {{ currentFilter === '전체' ? '반영 완료만 보기' : '전체 보기' }}
      </button>
      <button class="ui-btn ui-btn--primary" @click="currentFilter = '반영 대기'">적재 대기 보기</button>
    </template>

    <section class="worker-page">
      <!-- 대시보드 톤의 상단 카드 -->
      <div class="summary-grid">
        <article v-for="card in summaryCards" :key="card.key" :class="`summary-card--${card.tone}`" class="summary-card">
          <p class="summary-card__label">{{ card.label }}</p>
          <strong class="summary-card__value">{{ card.value }}</strong>
          <span class="summary-card__desc">{{ card.desc }}</span>
        </article>
      </div>

      <article class="panel-card">
        <div class="section-head">
          <div>
            <h2 class="section-title">입고 기반 재고 반영 현황</h2>
            <p class="section-subtitle">검수와 적재가 모두 끝난 Bin만 재고로 활성화되도록 화면을 나눴습니다.</p>
          </div>
          <div class="filter-chip-group">
            <button
              v-for="filter in FILTERS"
              :key="filter"
              :class="['filter-chip', { 'filter-chip--active': currentFilter === filter }]"
              @click="currentFilter = filter"
            >
              {{ filter }}
            </button>
          </div>
        </div>

        <div class="info-grid">
          <div class="info-card">
            <span>반영 기준</span>
            <strong>검수 완료 + 적재 완료</strong>
            <p>두 조건이 모두 만족되어야 재고 활성 상태로 전환됩니다.</p>
          </div>
          <div class="info-card info-card--accent">
            <span>작업자 확인 포인트</span>
            <strong>위치 / 수량 / 반영시각</strong>
            <p>반영 대기 건은 적재 수량과 위치 입력 누락 여부를 우선 확인합니다.</p>
          </div>
        </div>

        <div class="task-table-wrap">
          <table class="task-table">
            <thead>
              <tr>
                <th>ASN</th>
                <th>셀러 회사명</th>
                <th>SKU</th>
                <th>위치</th>
                <th>검수 수량</th>
                <th>적재 수량</th>
                <th>재고 상태</th>
                <th>갱신 시각</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in filteredRows" :key="`${row.refNo}-${row.sku}-${row.location}`">
                <td>{{ row.refNo }}</td>
                <td>{{ row.sellerCompany }}</td>
                <td>{{ row.sku }}</td>
                <td>{{ row.location }}</td>
                <td>{{ row.inspectedQty }}</td>
                <td>{{ row.putQty }}</td>
                <td><span :class="inventoryStatusClass(row.stockStatus)">{{ row.stockStatus }}</span></td>
                <td>{{ row.updatedAt }}</td>
              </tr>
              <tr v-if="!filteredRows.length">
                <td class="empty-row" colspan="8">선택한 조건의 재고 데이터가 없습니다.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </article>
    </section>
  </AppLayout>
</template>

<style scoped>
.worker-page {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--space-4);
}

.summary-card,
.panel-card,
.info-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-sm);
}

.summary-card {
  min-height: 132px;
  padding: var(--space-5);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.summary-card__label { font-size: var(--font-size-sm); color: var(--t3); font-weight: 600; }
.summary-card__value { font-family: var(--font-condensed); font-size: clamp(24px, 1.77vw, 34px); line-height: 1; }
.summary-card__desc { color: var(--t3); font-size: var(--font-size-sm); }
.summary-card--blue { border-top: 4px solid var(--blue); }
.summary-card--green { border-top: 4px solid var(--green); }
.summary-card--amber { border-top: 4px solid var(--amber); }
.summary-card--purple { border-top: 4px solid var(--purple); }

.panel-card {
  padding: var(--space-5);
}

.section-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-4);
  margin-bottom: var(--space-4);
}

.section-title { font-size: var(--font-size-xl); font-family: var(--font-condensed); }
.section-subtitle { margin-top: 6px; color: var(--t3); font-size: var(--font-size-sm); line-height: 1.5; }

.filter-chip-group { display: flex; gap: var(--space-2); flex-wrap: wrap; }
.filter-chip {
  border: 1px solid var(--border);
  background: var(--surface-2);
  color: var(--t2);
  border-radius: var(--radius-full);
  height: 34px;
  padding: 0 14px;
  font-size: var(--font-size-sm);
  font-weight: 600;
}
.filter-chip--active { background: var(--blue); color: #fff; border-color: var(--blue); }

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-3);
  margin-bottom: var(--space-4);
}

.info-card {
  padding: var(--space-4);
  background: var(--surface-2);
}
.info-card span { color: var(--t3); font-size: var(--font-size-xs); }
.info-card strong { display: block; margin-top: 8px; font-size: var(--font-size-lg); }
.info-card p { margin-top: 6px; color: var(--t3); font-size: var(--font-size-sm); line-height: 1.5; }
.info-card--accent {
  background: linear-gradient(180deg, rgba(76, 116, 255, 0.08), rgba(76, 116, 255, 0.02));
  border-color: rgba(76, 116, 255, 0.18);
}

.task-table-wrap {
  overflow-x: auto;
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
}
.task-table { width: 100%; border-collapse: collapse; }
.task-table thead tr { background: var(--surface-2); }
.task-table th, .task-table td { padding: 14px 16px; text-align: left; border-bottom: 1px solid var(--border); white-space: nowrap; }
.task-table th { font-size: var(--font-size-xs); color: var(--t3); text-transform: uppercase; }
.task-table td { font-size: var(--font-size-sm); color: var(--t2); }
.task-table tbody tr:last-child td { border-bottom: none; }

.status-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 64px;
  height: 28px;
  padding: 0 10px;
  border-radius: var(--radius-full);
  font-size: var(--font-size-xs);
  font-weight: 700;
}
.status-chip--green { background: var(--green-pale); color: var(--green); }
.status-chip--amber { background: var(--amber-pale); color: #b45309; }

.empty-row { text-align: center !important; color: var(--t3); padding: 42px 16px !important; }

.ui-btn {
  height: 40px;
  padding: 0 16px;
  border-radius: var(--radius-lg);
  border: 1px solid var(--border);
  font-size: var(--font-size-sm);
  font-weight: 600;
}
.ui-btn--ghost { background: var(--surface); color: var(--t2); }
.ui-btn--primary { background: var(--blue); color: #fff; border-color: var(--blue); }

@media (max-width: 1400px) {
  .summary-grid,
  .info-grid {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 960px) {
  .summary-grid,
  .info-grid {
    grid-template-columns: 1fr;
  }

  .section-head {
    flex-direction: column;
  }
}
</style>
