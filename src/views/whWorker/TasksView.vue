<script setup>
import { computed, ref } from 'vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import TimelineStepper from '@/components/common/TimelineStepper.vue'

// 헤더 breadcrumb
const breadcrumb = [{ label: 'WH Worker' }, { label: '내 작업' }]

// 내 작업 화면 목업 데이터
const FILTERS = ['전체', '대기', '진행중', '완료']

const TASKS_SEED = Object.freeze([
  {
    id: 'IB-2026-0312-01',
    type: '검수&적재',
    sellerCompany: '아반셀러코리아',
    refNo: 'ASN-240312-A01',
    assignedBinCount: 3,
    totalQty: 170,
    status: '대기',
    currentStep: '검수',
    steps: [
      { key: '검수', label: '검수' },
      { key: '적재', label: '적재' },
    ],
    referenceStatus: '입고예정',
    note: '오늘 오전 신규 입고 건으로, 지정된 Bin 기준으로 검수부터 시작합니다.',
  },
  {
    id: 'IB-2026-0312-02',
    type: '검수&적재',
    sellerCompany: '푸드라인컴퍼니',
    refNo: 'ASN-240312-B04',
    assignedBinCount: 2,
    totalQty: 80,
    status: '진행중',
    currentStep: '적재',
    steps: [
      { key: '검수', label: '검수' },
      { key: '적재', label: '적재' },
    ],
    referenceStatus: '검수완료',
    note: '검수는 마감되었고 적재 마무리만 남아 있습니다.',
  },
  {
    id: 'OB-2026-0312-04',
    type: '피킹&패킹',
    sellerCompany: '모던키친랩',
    refNo: 'PICK-240312-901',
    assignedBinCount: 4,
    totalQty: 22,
    status: '진행중',
    currentStep: '패킹 검수',
    steps: [
      { key: '피킹', label: '피킹' },
      { key: '패킹 검수', label: '패킹 검수' },
      { key: '작업 완료', label: '작업 완료' },
    ],
    referenceStatus: '패킹검수중',
    note: '피킹은 완료되었고 패킹 검수 확인만 남아 있습니다.',
  },
  {
    id: 'IB-2026-0311-03',
    type: '검수&적재',
    sellerCompany: '리빙앤코',
    refNo: 'ASN-240311-C11',
    assignedBinCount: 1,
    totalQty: 35,
    status: '완료',
    currentStep: '적재',
    steps: [
      { key: '검수', label: '검수' },
      { key: '적재', label: '적재' },
    ],
    referenceStatus: '보관중',
    note: '오늘 14:00 전 시작 권장',
  },
])

const tasks = ref(JSON.parse(JSON.stringify(TASKS_SEED)))
const activeFilter = ref('전체')
const selectedTaskId = ref('IB-2026-0311-03')

const filteredTasks = computed(() => {
  const ordered = [...tasks.value]
  if (activeFilter.value === '전체') return ordered
  return ordered.filter((task) => task.status === activeFilter.value)
})

const selectedTask = computed(() => {
  return tasks.value.find((task) => task.id === selectedTaskId.value) ?? filteredTasks.value[0] ?? null
})

function selectTask(taskId) {
  selectedTaskId.value = taskId
}

function statusClass(status) {
  if (status === '대기') return 'status-badge--wait'
  if (status === '진행중') return 'status-badge--progress'
  return 'status-badge--done'
}

const summaryInfo = computed(() => {
  const task = selectedTask.value
  if (!task) return []

  return [
    { label: '셀러 회사명', value: task.sellerCompany },
    { label: '참조번호', value: task.refNo },
    { label: '기존 상태', value: task.referenceStatus },
    { label: '담당 Bin', value: `${task.assignedBinCount} Bin` },
    { label: '총 수량', value: `${task.totalQty}개` },
    { label: '작업 메모', value: task.note },
  ]
})
</script>

<template>
  <AppLayout title="내 작업" :breadcrumb="breadcrumb">
    <div class="tasks-page">
      <!-- 상단: 오늘 배정된 작업 목록 카드 -->
      <section class="section-card">
        <div class="section-card__header section-card__header--table">
          <h2 class="section-title">오늘 배정된 작업 목록</h2>

          <div class="filter-tabs" role="tablist" aria-label="작업 상태 필터">
            <button
              v-for="filter in FILTERS"
              :key="filter"
              type="button"
              class="filter-tab"
              :class="{ 'filter-tab--active': activeFilter === filter }"
              @click="activeFilter = filter"
            >
              {{ filter }}
            </button>
          </div>
        </div>

        <!-- 작업 목록 테이블 -->
        <div class="task-table-wrap">
          <table class="task-table">
            <thead>
              <tr>
                <th>작업 ID</th>
                <th>작업 유형</th>
                <th>셀러 회사명</th>
                <th>참조번호</th>
                <th>담당 BIN</th>
                <th>수량</th>
                <th>상태</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="task in filteredTasks"
                :key="task.id"
                class="task-row"
                :class="{ 'task-row--selected': selectedTask?.id === task.id }"
                @click="selectTask(task.id)"
              >
                <td>{{ task.id }}</td>
                <td>{{ task.type }}</td>
                <td>{{ task.sellerCompany }}</td>
                <td>{{ task.refNo }}</td>
                <td>{{ task.assignedBinCount }} Bin</td>
                <td>{{ task.totalQty }}</td>
                <td>
                  <span class="status-badge" :class="statusClass(task.status)">{{ task.status }}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- 하단: 선택 작업 요약 카드 -->
      <section v-if="selectedTask" class="section-card summary-card">
        <div class="section-card__header summary-card__header">
          <h2 class="section-title">선택 작업 요약</h2>
          <a class="summary-link" href="#">입고 관리에서 열기</a>
        </div>

        <div class="summary-card__body">
          <div class="summary-top">
            <div>
              <p class="task-kind">{{ selectedTask.type }}</p>
              <div class="summary-title-row">
                <h3 class="summary-id">{{ selectedTask.id }}</h3>
                <span class="status-badge" :class="statusClass(selectedTask.status)">{{ selectedTask.status }}</span>
              </div>
            </div>
          </div>

          <div class="stepper-wrap">
            <TimelineStepper :steps="selectedTask.steps" :current-step="selectedTask.currentStep" />
          </div>

          <!-- 요약 정보 박스는 3열 x 2행 구조 -->
          <div class="summary-grid-boxes">
            <article v-for="item in summaryInfo" :key="item.label" class="info-box">
              <p class="info-box__label">{{ item.label }}</p>
              <p class="info-box__value">{{ item.value }}</p>
            </article>
          </div>
        </div>
      </section>
    </div>
  </AppLayout>
</template>

<style scoped>
.tasks-page {
  display: grid;
  gap: 24px;
}

.section-card {
  background: var(--surface, #fff);
  border: 1px solid var(--border);
  border-radius: 20px;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.04);
  overflow: hidden;
}

.section-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 18px 20px 0;
}

.section-card__header--table {
  padding-bottom: 14px;
}

.section-title {
  margin: 0;
  font-size: 18px;
  line-height: 1.2;
  font-weight: 800;
  color: var(--text-primary, #172554);
}

.filter-tabs {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.filter-tab {
  min-width: 56px;
  height: 38px;
  padding: 0 18px;
  border-radius: 999px;
  border: 1px solid var(--border);
  background: var(--surface-2, #f8fafc);
  color: var(--text-primary, #172554);
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
}

.filter-tab--active {
  background: var(--blue, #4f6ef7);
  border-color: var(--blue, #4f6ef7);
  color: #fff;
}

.task-table-wrap {
  padding: 0 12px 14px;
}

.task-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  border: 1px solid var(--border);
  border-radius: 16px;
  overflow: hidden;
  background: #fff;
}

.task-table thead th {
  padding: 14px 16px;
  background: #fff;
  border-bottom: 1px solid var(--border);
  color: var(--t4, #7c8aa5);
  font-size: 13px;
  font-weight: 700;
  text-align: left;
}

.task-table tbody td {
  padding: 18px 16px;
  border-bottom: 1px solid var(--border);
  color: var(--text-primary, #172554);
  font-size: 14px;
  font-weight: 600;
}

.task-table tbody tr:last-child td {
  border-bottom: 0;
}

.task-row {
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.task-row:hover {
  background: rgba(79, 110, 247, 0.04);
}

.task-row--selected {
  background: rgba(79, 110, 247, 0.12);
}

.status-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 64px;
  height: 32px;
  padding: 0 14px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 800;
}

.status-badge--wait {
  background: #fff7df;
  color: #ba7a00;
}

.status-badge--progress {
  background: #eef2ff;
  color: #4f6ef7;
}

.status-badge--done {
  background: #e8f8f0;
  color: #16a34a;
}

.summary-card {
  padding: 0 0 18px;
}

.summary-card__header {
  padding-bottom: 12px;
}

.summary-link {
  color: var(--blue, #4f6ef7);
  font-size: 14px;
  font-weight: 700;
  text-decoration: none;
}

.summary-card__body {
  padding: 0 20px 0;
}

.summary-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
}

.summary-top > div {
  width: 100%;
}

.task-kind {
  margin: 0 0 6px;
  color: var(--blue, #4f6ef7);
  font-size: 13px;
  font-weight: 800;
}

.summary-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.summary-title-row .status-badge {
  flex-shrink: 0;
}

.summary-id {
  margin: 0;
  font-size: 16px;
  line-height: 1.35;
  font-weight: 800;
  color: var(--text-primary, #172554);
}

.stepper-wrap {
  margin-bottom: 20px;
  padding: 0 8px;
}

.summary-grid-boxes {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.info-box {
  min-height: 88px;
  padding: 16px 18px;
  border-radius: 16px;
  border: 1px solid var(--border);
  background: var(--surface-2, #f8fafc);
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  text-align: left;
}

.info-box__label {
  margin: 0 0 12px;
  color: var(--t4, #7c8aa5);
  font-size: 13px;
  font-weight: 700;
}

.info-box__value {
  margin: 0;
  color: var(--text-primary, #172554);
  font-size: 14px;
  line-height: 1.45;
  font-weight: 700;
  word-break: keep-all;
}

@media (max-width: 1280px) {
  .section-title {
    font-size: 18px;
  }

  .summary-id {
    font-size: 16px;
  }

  .summary-grid-boxes {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 860px) {
  .section-card__header,
  .summary-title-row {
    flex-direction: column;
    align-items: flex-start;
  }

  .task-table-wrap {
    overflow-x: auto;
  }

  .task-table {
    min-width: 880px;
  }

  .summary-grid-boxes {
    grid-template-columns: 1fr;
  }
}
</style>
