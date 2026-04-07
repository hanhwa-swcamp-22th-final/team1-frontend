<script setup>
import { ref, computed, watch } from 'vue'
import { BIN_STATUS } from '@/constants'

const props = defineProps({
  locations:    { type: Array,  default: () => [] },
  highlightBin: { type: String, default: null },
})

// ── Zone 탭 관리
const activeZone = ref(null)

function initZone() {
  if (!props.locations.length) return
  if (props.highlightBin) {
    const zoneId = props.highlightBin.split('-')[0]
    const found  = props.locations.find(z => z.zone === zoneId)
    if (found) { activeZone.value = found.zone; return }
  }
  activeZone.value = props.locations[0].zone
}

// locations가 채워지거나 highlightBin이 바뀔 때 zone 자동 선택
watch(() => props.locations, (v) => { if (v.length && !activeZone.value) initZone() }, { immediate: true })
watch(() => props.highlightBin, () => { if (props.highlightBin) initZone() })

const currentZone = computed(() =>
  props.locations.find(z => z.zone === activeZone.value) ?? null
)

// ── 색상 매핑
const STATUS_COLOR = {
  [BIN_STATUS.EMPTY]:    'var(--green)',
  [BIN_STATUS.OCCUPIED]: 'var(--blue)',
  [BIN_STATUS.CAUTION]:  '#d97706',
  [BIN_STATUS.FULL]:     'var(--red)',
}
const STATUS_BG = {
  [BIN_STATUS.EMPTY]:    'var(--green-pale)',
  [BIN_STATUS.OCCUPIED]: 'var(--blue-pale)',
  [BIN_STATUS.CAUTION]:  '#fef3c7',
  [BIN_STATUS.FULL]:     'var(--red-pale)',
}
const STATUS_LABEL = {
  [BIN_STATUS.EMPTY]:    '비어있음',
  [BIN_STATUS.OCCUPIED]: '사용 중',
  [BIN_STATUS.CAUTION]:  '주의 (70%↑)',
  [BIN_STATUS.FULL]:     '포화',
}

// ── 팝오버 상태
const popover      = ref(null)   // bin 객체
const popoverStyle = ref({})

function openPopover(bin, event) {
  popover.value = bin
  const rect        = event.currentTarget.getBoundingClientRect()
  const containerEl = event.currentTarget.closest('.map-container')
  if (!containerEl) return
  const containerRect = containerEl.getBoundingClientRect()
  popoverStyle.value = {
    top:       `${rect.top - containerRect.top - 8}px`,
    left:      `${rect.left - containerRect.left + rect.width / 2}px`,
    transform: 'translate(-50%, -100%)',
  }
}

function closePopover() {
  popover.value = null
}

function occupancyPct(bin) {
  if (!bin.capacity) return 0
  return Math.round((bin.usedQty / bin.capacity) * 100)
}
</script>

<template>
  <div class="warehouse-map">

    <!-- Zone 탭 -->
    <div class="zone-tabs">
      <button
        v-for="zone in locations"
        :key="zone.zone"
        class="zone-tab"
        :class="{ 'zone-tab--active': activeZone === zone.zone }"
        @click="activeZone = zone.zone; closePopover()"
      >
        {{ zone.zoneName }}
        <span class="zone-purpose">{{ zone.purpose }}</span>
      </button>
    </div>

    <!-- 그리드 -->
    <div class="map-container" @click.self="closePopover" v-if="currentZone">

      <!-- Rack을 가로로 나열, Bin은 아래→위 (실제 창고 랙 구조) -->
      <div class="racks-container">
        <div v-for="rack in currentZone.racks" :key="rack.rack" class="rack-col">
          <div class="bin-stack">
            <button
              v-for="bin in rack.bins"
              :key="bin.bin"
              class="bin-cell"
              :class="{ 'bin-cell--highlight': highlightBin === bin.bin }"
              :style="{
                borderColor:     STATUS_COLOR[bin.status] ?? 'var(--border)',
                backgroundColor: STATUS_BG[bin.status]   ?? 'var(--surface-2)',
              }"
              @click.stop="openPopover(bin, $event)"
            >
              <span class="bin-code">{{ bin.bin }}</span>
              <span class="bin-pct" :style="{ color: STATUS_COLOR[bin.status] ?? 'var(--t3)' }">
                {{ bin.status === BIN_STATUS.EMPTY ? '빈 공간' : `${occupancyPct(bin)}%` }}
              </span>
            </button>
          </div>
          <div class="rack-label">R-{{ rack.rack }}</div>
        </div>
      </div>

      <!-- 팝오버 -->
      <div
        v-if="popover"
        class="bin-popover"
        :style="popoverStyle"
        @click.stop
      >
        <button class="popover-close" @click="closePopover">✕</button>
        <div class="popover-header">
          <span class="popover-bin">{{ popover.bin }}</span>
          <span class="popover-status" :style="{ color: STATUS_COLOR[popover.status] }">
            {{ STATUS_LABEL[popover.status] }}
          </span>
        </div>
        <div v-if="popover.sku" class="popover-body">
          <div class="popover-row"><span class="pl">SKU</span><span class="pv mono">{{ popover.sku }}</span></div>
          <div class="popover-row"><span class="pl">품목</span><span class="pv">{{ popover.skuName }}</span></div>
          <div class="popover-row"><span class="pl">셀러</span><span class="pv">{{ popover.seller }}</span></div>
          <div class="popover-row">
            <span class="pl">적재량</span>
            <span class="pv"><strong>{{ popover.usedQty.toLocaleString() }}</strong> / {{ popover.capacity.toLocaleString() }}개</span>
          </div>
        </div>
        <div v-else class="popover-empty">비어있는 Bin입니다.</div>
      </div>
    </div>

    <!-- 범례 -->
    <div class="legend">
      <span v-for="(color, key) in STATUS_COLOR" :key="key" class="legend-item">
        <span class="legend-dot" :style="{ background: color }"></span>
        {{ STATUS_LABEL[key] }}
      </span>
    </div>

  </div>
</template>

<style scoped>
.warehouse-map {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

/* ── Zone 탭 */
.zone-tabs {
  display: flex;
  gap: var(--space-2);
  flex-wrap: wrap;
}

.zone-tab {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  padding: 8px 16px;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--surface);
  cursor: pointer;
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--t2);
  transition: all var(--ease-fast);
}

.zone-tab:hover        { border-color: var(--blue); color: var(--blue); }
.zone-tab--active      { border-color: var(--blue); background: var(--blue-pale); color: var(--blue); }

.zone-purpose {
  font-size: var(--font-size-xs);
  font-weight: 400;
  color: var(--t3);
}

/* ── 맵 컨테이너 */
.map-container {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding: var(--space-4);
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
}

/* ── Rack 열 (세로 배치) */
.racks-container {
  display: flex;
  flex-direction: row;
  align-items: flex-end;
  gap: var(--space-3);
  overflow-x: auto;
  padding-bottom: var(--space-2);
}

.rack-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
  flex-shrink: 0;
}

.bin-stack {
  display: flex;
  flex-direction: column-reverse;
  gap: var(--space-2);
}

.rack-label {
  font-size: var(--font-size-xs);
  font-weight: 700;
  color: var(--t3);
  text-align: center;
  padding-top: 4px;
  border-top: 1px solid var(--border);
  width: 100%;
}

/* ── Bin 셀 */
.bin-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  width: 84px;
  padding: 8px 6px;
  border: 2px solid transparent;
  border-radius: var(--radius-md);
  cursor: pointer;
  background: none;
  transition: all var(--ease-fast);
}

.bin-cell:hover {
  filter: brightness(0.95);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0,0,0,0.12);
}

.bin-cell--highlight {
  box-shadow: 0 0 0 3px var(--blue), 0 2px 8px rgba(0,0,0,0.15);
  transform: translateY(-1px);
}

.bin-code {
  font-family: var(--font-mono);
  font-size: var(--font-size-xs);
  font-weight: 700;
  color: var(--t1);
}

.bin-pct {
  font-size: 10px;
  font-weight: 600;
}

/* ── 팝오버 */
.bin-popover {
  position: absolute;
  z-index: 100;
  min-width: 220px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  box-shadow: 0 8px 24px rgba(0,0,0,0.15);
  padding: var(--space-3);
}

.popover-close {
  position: absolute;
  top: 6px;
  right: 8px;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--t3);
  font-size: 12px;
  line-height: 1;
  padding: 2px;
}

.popover-header {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-bottom: var(--space-2);
  padding-right: 20px;
}

.popover-bin {
  font-family: var(--font-mono);
  font-size: var(--font-size-sm);
  font-weight: 700;
  color: var(--t1);
}

.popover-status {
  font-size: var(--font-size-xs);
  font-weight: 600;
}

.popover-body {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.popover-row {
  display: flex;
  gap: var(--space-2);
  font-size: var(--font-size-xs);
}

.pl   { color: var(--t3); min-width: 36px; flex-shrink: 0; }
.pv   { color: var(--t1); }
.mono { font-family: var(--font-mono); }

.popover-empty {
  font-size: var(--font-size-xs);
  color: var(--t3);
  padding: var(--space-1) 0;
}

/* ── 범례 */
.legend {
  display: flex;
  gap: var(--space-4);
  flex-wrap: wrap;
}

.legend-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: var(--font-size-xs);
  color: var(--t2);
}

.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: var(--radius-sm);
  flex-shrink: 0;
}
</style>
