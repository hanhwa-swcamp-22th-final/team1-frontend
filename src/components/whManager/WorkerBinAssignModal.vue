<script setup>
import { ref, computed, watch } from 'vue'
import BaseModal from '@/components/common/BaseModal.vue'
import { BIN_STATUS } from '@/constants'

const props = defineProps({
  isOpen:  { type: Boolean, required: true },
  worker:  { type: Object,  default: null  },
  allBins: { type: Array,   default: () => [] },
})

const emit = defineEmits(['confirm', 'cancel'])

// { [binId]: { checked, taskType } }
const localState = ref({})

watch(
  () => [props.isOpen, props.worker, props.allBins],
  () => {
    if (!props.isOpen || !props.worker) return
    const state = {}
    props.allBins.forEach(b => {
      const mine = b.workerId === props.worker.id
      state[b.id] = {
        checked:  mine,
      }
    })
    localState.value = state
  },
  { immediate: true },
)

// Zone별 그룹핑
const grouped = computed(() => {
  const map = {}
  props.allBins.forEach(b => {
    const zone = b.zone ?? b.bin.split('-')[0]
    if (!map[zone]) map[zone] = []
    map[zone].push(b)
  })
  return Object.entries(map).sort(([a], [b]) => a.localeCompare(b))
})

function isOtherWorker(bin) {
  return !!bin.workerId && bin.workerId !== props.worker?.id
}

const STATUS_LABEL = {
  [BIN_STATUS.EMPTY]:    '비어있음',
  [BIN_STATUS.OCCUPIED]: '사용 중',
  [BIN_STATUS.CAUTION]:  '주의(70%↑)',
  [BIN_STATUS.FULL]:     '포화',
}

function confirm() {
  if (!props.worker) return
  const added = []
  const removed = []

  props.allBins.forEach(b => {
    const state = localState.value[b.id]
    const wasAssigned = b.workerId === props.worker.id
    const nowChecked = state?.checked ?? false

    if (!wasAssigned && nowChecked) {
      added.push({ binId: b.id })
    } else if (wasAssigned && !nowChecked) {
      removed.push(b.id)
    }
  })

  emit('confirm', { workerId: props.worker.id, added, removed })
}
</script>

<template>
  <BaseModal
    :title="`Bin 배정 편집 — ${worker?.name ?? ''} (${worker?.id ?? ''})`"
    :isOpen="isOpen"
    width="600px"
    @confirm="confirm"
    @cancel="$emit('cancel')"
  >
    <div class="modal-body">
      <p class="hint">체크한 Bin이 이 작업자에게 배정됩니다. 다른 작업자가 담당 중인 Bin은 선택할 수 없습니다.</p>

      <div v-for="[zone, bins] in grouped" :key="zone" class="zone-section">
        <div class="zone-label">Zone {{ zone }}</div>
        <div class="bin-grid">
          <div
            v-for="bin in bins"
            :key="bin.id"
            class="bin-item"
            :class="{
              'bin-item--mine':     localState[bin.id]?.checked,
              'bin-item--disabled': isOtherWorker(bin),
              'bin-item--full':     bin.status === BIN_STATUS.FULL,
            }"
          >
            <label class="bin-label">
              <input
                type="checkbox"
                :checked="localState[bin.id]?.checked"
                :disabled="isOtherWorker(bin)"
                class="bin-check"
                @change="e => localState[bin.id].checked = e.target.checked"
              />
              <span class="bin-code">{{ bin.bin }}</span>
            </label>

            <div class="bin-meta">
              <span
                v-if="bin.status"
                class="status-dot"
                :class="`status-dot--${bin.status}`"
              >{{ STATUS_LABEL[bin.status] ?? bin.status }}</span>
              <span v-if="bin.capacity" class="capacity-text">
                {{ bin.usedQty ?? 0 }}/{{ bin.capacity }}
              </span>
            </div>

            <div v-if="isOtherWorker(bin)" class="other-worker">{{ bin.workerName }}</div>
          </div>
        </div>
      </div>

      <div v-if="!allBins.length" class="empty">창고 배치도 데이터를 불러오는 중입니다.</div>
    </div>
  </BaseModal>
</template>

<style scoped>
.modal-body {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  max-height: 60vh;
  overflow-y: auto;
}

.hint {
  margin: 0;
  font-size: var(--font-size-sm);
  color: var(--t3);
  line-height: 1.5;
}

.zone-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.zone-label {
  font-size: var(--font-size-xs);
  font-weight: 700;
  color: var(--t3);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  padding-bottom: 4px;
  border-bottom: 1px solid var(--border);
}

.bin-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: var(--space-2);
}

.bin-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 8px 10px;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--surface);
  transition: border-color 0.15s, background 0.15s;
}

.bin-item--mine {
  border-color: var(--blue);
  background: var(--blue-pale);
}

.bin-item--disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.bin-item--full {
  border-color: var(--red);
}

.bin-label {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  cursor: pointer;
}

.bin-item--disabled .bin-label { cursor: not-allowed; }

.bin-check { width: 15px; height: 15px; flex-shrink: 0; cursor: pointer; }
.bin-item--disabled .bin-check { cursor: not-allowed; }

.bin-code {
  font-family: var(--font-mono);
  font-size: var(--font-size-xs);
  font-weight: 700;
  color: var(--t1);
}

.bin-meta {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex-wrap: wrap;
}

.status-dot {
  font-size: 10px;
  font-weight: 600;
  padding: 1px 6px;
  border-radius: var(--radius-full);
}
.status-dot--empty    { background: var(--green-pale);  color: var(--green); }
.status-dot--occupied { background: var(--blue-pale);   color: var(--blue);  }
.status-dot--caution  { background: #fef3c7; color: #92400e; }
.status-dot--full     { background: var(--red-pale);    color: var(--red);   }

.capacity-text {
  font-size: 10px;
  color: var(--t3);
}

.other-worker {
  font-size: 10px;
  color: var(--t3);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.task-select {
  width: 100%;
  height: 26px;
  padding: 0 6px;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--surface);
  color: var(--t1);
  font-size: 11px;
  cursor: pointer;
  margin-top: 2px;
}

.empty {
  text-align: center;
  color: var(--t3);
  font-size: var(--font-size-sm);
  padding: var(--space-4) 0;
}
</style>