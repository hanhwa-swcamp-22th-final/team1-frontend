<script setup>
/**
 * MasterStatusTabs -- masterAdmin 목록 화면 공통 상태 탭
 *
 * props:
 *   tabs      (Array)  -- [{ key, label, color? }]
 *   activeKey (String) -- 현재 선택된 탭 key
 *   counts    (Object) -- 탭별 건수 맵
 *
 * emits:
 *   change(newKey) -- 탭 선택 변경
 *
 * 목적:
 *   AsnList / OrderList 등 목록 화면에서 반복되는
 *   "상태 탭 + 활성 스타일 + 카운트 배지" UI를 공통화한다.
 */
const props = defineProps({
  tabs: {
    type: Array,
    required: true,
  },
  activeKey: {
    type: String,
    required: true,
  },
  counts: {
    type: Object,
    default: () => ({}),
  },
})

const emit = defineEmits(['change'])

/** 현재 선택된 탭에만 강조 팔레트를 적용한다. */
function tabActiveStyle(tab) {
  if (props.activeKey !== tab.key) return {}
  if (!tab.color) {
    return {
      background: 'rgba(245,166,35,0.12)',
      borderColor: 'var(--gold)',
      color: 'var(--gold)',
    }
  }
  return {
    background: tab.color.bg,
    borderColor: tab.color.border,
    color: tab.color.text,
  }
}

/** 활성 탭의 카운트 배지만 강조색으로 맞춘다. */
function tabCountStyle(tab) {
  if (props.activeKey !== tab.key) return {}
  if (!tab.color) return { background: 'var(--gold)', color: '#fff' }
  return { background: tab.color.border, color: '#fff' }
}
</script>

<template>
  <div class="filter-tabs">
    <button
      v-for="tab in tabs"
      :key="tab.key"
      class="filter-tab"
      :class="{ active: activeKey === tab.key }"
      :style="tabActiveStyle(tab)"
      type="button"
      @click="emit('change', tab.key)"
    >
      {{ tab.label }}
      <span class="filter-count" :style="tabCountStyle(tab)">{{ counts[tab.key] ?? 0 }}</span>
    </button>
  </div>
</template>

<style scoped>
.filter-tabs {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.filter-tab {
  padding: 8px 16px;
  border-radius: 4px;
  border: 1px solid var(--border);
  background: var(--surface);
  font-family: 'Barlow', sans-serif;
  font-weight: 500;
  font-size: 13px;
  color: var(--t2);
  cursor: pointer;
  white-space: nowrap;
  transition: background var(--ease-fast), border-color var(--ease-fast), color var(--ease-fast);
}

.filter-tab.active {
  font-weight: 700;
}

.filter-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 18px;
  padding: 0 5px;
  margin-left: 6px;
  background: var(--border);
  border-radius: 9px;
  font-size: 10px;
  font-weight: 700;
  color: var(--t2);
  transition: background var(--ease-fast), color var(--ease-fast);
}
</style>
