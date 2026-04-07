<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import AppLayout from '@/components/layout/AppLayout.vue'
import BaseTable from '@/components/common/BaseTable.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import WarehouseMap from '@/components/whManager/WarehouseMap.vue'
import { getWhmLocations } from '@/api/wms'
import { BIN_STATUS } from '@/constants'

const route = useRoute()

const highlightBin = ref(route.query.bin ?? null)
const locations    = ref([])
const loading      = ref(false)

async function fetchLocations() {
  loading.value = true
  try {
    const { data } = await getWhmLocations()
    locations.value = data.data
  } catch (e) {
    console.error('창고 로케이션 조회 실패:', e)
  } finally {
    loading.value = false
  }
}

onMounted(fetchLocations)

// ── KPI: 전체 bin 평탄화
const allBins = computed(() =>
  locations.value.flatMap(z => z.racks.flatMap(r => r.bins))
)

const kpi = computed(() => {
  const bins = allBins.value
  const used = bins.filter(b => b.status !== BIN_STATUS.EMPTY).length
  return {
    total:   bins.length,
    used,
    caution: bins.filter(b => b.status === BIN_STATUS.CAUTION).length,
    full:    bins.filter(b => b.status === BIN_STATUS.FULL).length,
    usePct:  bins.length ? Math.round(used / bins.length * 100) : 0,
  }
})

// 포화 임박 Bin (caution + full), 사용률 내림차순
const warningBins = computed(() =>
  allBins.value
    .filter(b => b.status === BIN_STATUS.CAUTION || b.status === BIN_STATUS.FULL)
    .map(b => ({ ...b, pct: Math.round((b.usedQty / b.capacity) * 100) }))
    .sort((a, b) => b.pct - a.pct)
)

const breadcrumb = [
  { label: 'CONK' },
  { label: '재고 관리' },
  { label: '창고 배치도' },
]

const warningCols = [
  { key: 'bin',      label: 'Bin',   width: '100px' },
  { key: 'status',   label: '상태',  width: '80px' },
  { key: 'sku',      label: 'SKU',   width: '130px' },
  { key: 'skuName',  label: '품목명' },
  { key: 'seller',   label: '셀러',  width: '120px' },
  { key: 'usedQty',  label: '적재량', align: 'right', width: '140px' },
  { key: 'pct',      label: '사용률', align: 'right', width: '80px' },
]
</script>

<template>
  <AppLayout title="창고 배치도" :breadcrumb="breadcrumb">

    <!-- KPI 카드 -->
    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-label">전체 Bin</div>
        <div class="kpi-value">{{ kpi.total }}</div>
      </div>
      <div class="kpi-card kpi-card--blue">
        <div class="kpi-label">사용 중</div>
        <div class="kpi-value kpi--blue">{{ kpi.used }}</div>
        <div class="kpi-sub">{{ kpi.usePct }}% 사용률</div>
      </div>
      <div class="kpi-card kpi-card--amber">
        <div class="kpi-label">주의 (70%↑)</div>
        <div class="kpi-value kpi--amber">{{ kpi.caution }}</div>
      </div>
      <div class="kpi-card kpi-card--red">
        <div class="kpi-label">포화</div>
        <div class="kpi-value kpi--red">{{ kpi.full }}</div>
      </div>
    </div>

    <!-- 배치도 카드 -->
    <div class="card">
      <div class="card-header">
        <h2 class="card-title">창고 배치도</h2>
        <div v-if="highlightBin" class="highlight-badge">
          🔍 <span class="mono">{{ highlightBin }}</span> 위치 표시 중
          <button class="clear-btn" @click="highlightBin = null">✕</button>
        </div>
      </div>
      <div class="card-body">
        <LoadingSpinner v-if="loading" size="md" />
        <WarehouseMap
          v-else
          :locations="locations"
          :highlightBin="highlightBin"
        />
      </div>
    </div>

    <!-- 포화 임박 Bin 목록 -->
    <div v-if="warningBins.length" class="card mt-4">
      <div class="card-header">
        <h2 class="card-title">⚠ 포화 임박 Bin</h2>
        <span class="card-subtitle">70% 이상 적재된 Bin — 행 클릭 시 위 지도에 표시</span>
      </div>
      <div class="card-body p-0">
        <BaseTable
          :columns="warningCols"
          :rows="warningBins"
          :pagination="null"
          row-key="bin"
          clickable
          @row-click="row => highlightBin = row.bin"
        >
          <template #cell-bin="{ value }">
            <span class="mono">{{ value }}</span>
          </template>
          <template #cell-status="{ row }">
            <span class="badge" :class="`badge--${row.status}`">
              {{ row.status === BIN_STATUS.FULL ? '포화' : '주의' }}
            </span>
          </template>
          <template #cell-sku="{ value }">
            <span class="mono text-xs">{{ value }}</span>
          </template>
          <template #cell-usedQty="{ row }">
            {{ row.usedQty.toLocaleString() }} / {{ row.capacity.toLocaleString() }}
          </template>
          <template #cell-pct="{ row }">
            <span :class="row.status === BIN_STATUS.FULL ? 'text-red' : 'text-amber'">{{ row.pct }}%</span>
          </template>
        </BaseTable>
      </div>
    </div>

  </AppLayout>
</template>

<style scoped>
/* ── KPI */
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-4);
  margin-bottom: var(--space-4);
}

.kpi-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-left: 3px solid var(--border);
  border-radius: var(--radius-lg);
  padding: var(--space-5);
}
.kpi-card--blue  { border-left-color: var(--blue); }
.kpi-card--amber { border-left-color: #d97706; }
.kpi-card--red   { border-left-color: var(--red); }

.kpi-label { font-size: var(--font-size-sm); color: var(--t3); margin-bottom: var(--space-2); }
.kpi-value {
  font-family: var(--font-condensed);
  font-size: var(--font-size-2xl);
  font-weight: 700;
  color: var(--t1);
  line-height: 1.1;
  margin-bottom: var(--space-2);
}
.kpi-sub    { font-size: var(--font-size-xs); color: var(--t3); }
.kpi--blue  { color: var(--blue); }
.kpi--amber { color: #d97706; }
.kpi--red   { color: var(--red); }

/* ── Card */
.card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  overflow: hidden;
}
.mt-4 { margin-top: var(--space-4); }

.card-header {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-4);
  border-bottom: 1px solid var(--border);
}

.card-title {
  font-size: var(--font-size-md);
  font-weight: 700;
  color: var(--t1);
  margin: 0;
}

.card-subtitle { font-size: var(--font-size-sm); color: var(--t3); }

.card-body   { padding: var(--space-4); }
.p-0         { padding: 0; }

/* Highlight badge */
.highlight-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: 4px 10px;
  background: var(--blue-pale);
  border: 1px solid var(--blue);
  border-radius: var(--radius-full);
  font-size: var(--font-size-xs);
  color: var(--blue);
  font-weight: 600;
}

.clear-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--blue);
  font-size: var(--font-size-xs);
  padding: 0 2px;
}

.text-amber { color: #d97706; }
.text-red   { color: var(--red); }
.text-xs    { font-size: var(--font-size-xs); }
.mono       { font-family: var(--font-mono); font-size: var(--font-size-xs); }

.badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: var(--radius-full);
  font-size: var(--font-size-xs);
  font-weight: 600;
}
.badge--caution { background: #fef3c7; color: #92400e; }
.badge--full    { background: var(--red-pale); color: var(--red); }
</style>
