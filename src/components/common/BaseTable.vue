<script setup>
/**
 * BaseTable — 정렬·페이지네이션 범용 테이블
 *
 * Props:
 *   columns   : Array<Column>       — 컬럼 정의 배열 (아래 Column 타입 참조)
 *   rows      : Array<Object>       — 데이터 행 배열
 *   loading   : boolean             — true면 테이블 대신 LoadingSpinner 표시
 *   pagination: Pagination | null   — null이면 페이지네이션 숨김
 *   rowKey    : string              — 행 고유키 필드명 (기본 'id')
 *
 * Column 타입:
 *   {
 *     key:       string,             // rows 객체의 필드명
 *     label:     string,             // 헤더 표시 텍스트
 *     sortable?: boolean,            // true면 헤더 클릭 시 sort 이벤트 발생
 *     width?:    string,             // CSS width (예: '120px', '10%')
 *     align?:    'left'|'center'|'right' // 기본 'left'
 *   }
 *
 * Pagination 타입:
 *   {
 *     page:     number,   // 현재 페이지 (1-based)
 *     pageSize: number,   // 페이지당 행 수
 *     total:    number    // 전체 데이터 수
 *   }
 *
 * Emits:
 *   sort(key: string)         — 정렬 가능한 컬럼 헤더 클릭 시
 *   page-change(page: number) — 페이지 버튼 클릭 시
 *
 * Slots:
 *   cell-{key} — 특정 컬럼 셀 커스텀 렌더링
 *   슬롯 props: { row: Object, value: any }
 *
 * cell-{key} 슬롯 사용 예:
 *   <BaseTable :columns="cols" :rows="rows" :pagination="pg" @sort="onSort" @page-change="onPage">
 *     <template #cell-status="{ row }">
 *       <StatusBadge :status="row.status" type="order" />
 *     </template>
 *     <template #cell-actions="{ row }">
 *       <button @click="edit(row)">수정</button>
 *     </template>
 *   </BaseTable>
 */
const props = defineProps({
  columns:    { type: Array,   required: true },
  rows:       { type: Array,   default: () => [] },
  loading:    { type: Boolean, default: false },
  pagination: { type: Object,  default: null },
  rowKey:     { type: String,  default: 'id' },
})

const emit = defineEmits(['sort', 'page-change'])

import { computed } from 'vue'

/** 전체 페이지 수 계산. pagination이 없으면 0 */
const totalPages = computed(() => {
  if (!props.pagination) return 0
  return Math.ceil(props.pagination.total / props.pagination.pageSize) || 1
})

/**
 * 페이지 번호 배열 생성 (ellipsis 포함)
 * 7페이지 이하: [1, 2, 3, 4, 5, 6, 7]
 * 8페이지 이상: [1, '...', cur-1, cur, cur+1, '...', total] 형태
 *
 * 예: 총 20페이지, 현재 10페이지 →
 *   [1, '...', 9, 10, 11, '...', 20]
 *
 * @returns {Array<number|string>}
 */
function pageNumbers() {
  const cur   = props.pagination?.page ?? 1
  const total = totalPages.value

  // 총 페이지가 7 이하면 ellipsis 없이 전부 표시
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)

  const pages = [1]
  // 현재 페이지가 3보다 크면 앞쪽 ellipsis
  if (cur > 3)          pages.push('...')
  // 현재 페이지 주변 ±1 범위 (1과 total 경계 피함)
  for (let i = Math.max(2, cur - 1); i <= Math.min(total - 1, cur + 1); i++) pages.push(i)
  // 현재 페이지가 끝에서 3보다 멀면 뒤쪽 ellipsis
  if (cur < total - 2)  pages.push('...')
  pages.push(total)
  return pages
}
</script>

<template>
  <div class="base-table-wrap">
    <!-- 테이블 -->
    <div class="table-scroll">
      <table class="base-table">
        <thead>
          <tr>
            <th
              v-for="col in columns"
              :key="col.key"
              :style="{ width: col.width, textAlign: col.align ?? 'left' }"
              :class="{ sortable: col.sortable }"
              @click="col.sortable && emit('sort', col.key)"
            >
              {{ col.label }}
              <span v-if="col.sortable" class="sort-icon">⇅</span>
            </th>
          </tr>
        </thead>

        <tbody>
          <!-- 로딩 상태: 데이터 대신 스피너 표시 -->
          <tr v-if="loading">
            <td :colspan="columns.length" class="state-cell">
              <LoadingSpinner size="sm" />
            </td>
          </tr>

          <!-- 빈 상태: 로딩 아닌데 데이터 없음 -->
          <tr v-else-if="!rows.length">
            <td :colspan="columns.length" class="state-cell">
              <EmptyState title="데이터가 없습니다" />
            </td>
          </tr>

          <!-- 데이터 행 -->
          <tr
            v-else
            v-for="row in rows"
            :key="row[rowKey]"
            class="data-row"
          >
            <td
              v-for="col in columns"
              :key="col.key"
              :style="{ textAlign: col.align ?? 'left' }"
            >
              <!--
                cell-{key} 슬롯이 없으면 기본값(row[col.key] ?? '-') 표시.
                커스텀 렌더링 필요 시 <template #cell-{key}="{ row, value }"> 사용.
              -->
              <slot :name="`cell-${col.key}`" :row="row" :value="row[col.key]">
                {{ row[col.key] ?? '-' }}
              </slot>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 페이지네이션: pagination prop이 있고 2페이지 이상일 때만 표시 -->
    <div v-if="pagination && totalPages > 1" class="pagination">
      <button
        class="page-btn"
        :disabled="pagination.page <= 1"
        @click="emit('page-change', pagination.page - 1)"
      >‹</button>

      <template v-for="p in pageNumbers()" :key="p">
        <span v-if="p === '...'" class="page-ellipsis">…</span>
        <button
          v-else
          class="page-btn"
          :class="{ active: p === pagination.page }"
          @click="emit('page-change', p)"
        >{{ p }}</button>
      </template>

      <button
        class="page-btn"
        :disabled="pagination.page >= totalPages"
        @click="emit('page-change', pagination.page + 1)"
      >›</button>

      <!-- 전체 데이터 수 및 현재 범위 표시 -->
      <span class="page-info">
        {{ pagination.total }}건 중 {{ (pagination.page - 1) * pagination.pageSize + 1 }}–{{ Math.min(pagination.page * pagination.pageSize, pagination.total) }}
      </span>
    </div>
  </div>
</template>

<script>
import LoadingSpinner from './LoadingSpinner.vue'
import EmptyState     from './EmptyState.vue'
export default { components: { LoadingSpinner, EmptyState } }
</script>

<style scoped>
.base-table-wrap { display: flex; flex-direction: column; gap: 12px; }

.table-scroll { overflow-x: auto; border-radius: var(--radius-md); border: 1px solid var(--border); }

.base-table {
  width: 100%; border-collapse: collapse;
  font-size: var(--font-size-sm);
}

thead tr {
  background: var(--surface-2);
  border-bottom: 1px solid var(--border);
}

th {
  padding: 12px 16px;
  font-weight: 600;
  color: var(--t3);
  font-size: var(--font-size-xs);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  white-space: nowrap;
  user-select: none;
}

th.sortable { cursor: pointer; }
th.sortable:hover { color: var(--t1); }

.sort-icon { margin-left: 4px; opacity: 0.5; font-size: 10px; }

tbody tr { border-bottom: 1px solid var(--border); }
tbody tr:last-child { border-bottom: none; }

.data-row { transition: background var(--ease-fast); }
.data-row:hover { background: var(--blue-pale); }

td {
  padding: 13px 16px;
  color: var(--t2);
  font-size: var(--font-size-sm);
}

.state-cell { padding: 48px 16px; text-align: center; }

/* ── Pagination ─────────────────────────────── */
.pagination {
  display: flex;
  align-items: center;
  gap: 4px;
  justify-content: center;
}

.page-btn {
  min-width: 32px; height: 32px;
  padding: 0 8px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--surface);
  color: var(--t2);
  font-size: var(--font-size-sm);
  transition: all var(--ease-fast);
}
.page-btn:hover:not(:disabled) {
  border-color: var(--blue);
  color: var(--blue);
}
.page-btn.active {
  background: var(--blue);
  border-color: var(--blue);
  color: #fff;
  font-weight: 600;
}
.page-btn:disabled { opacity: 0.35; cursor: default; }

.page-ellipsis { padding: 0 4px; color: var(--t4); }

.page-info {
  margin-left: 12px;
  font-size: var(--font-size-xs);
  color: var(--t3);
}
</style>
