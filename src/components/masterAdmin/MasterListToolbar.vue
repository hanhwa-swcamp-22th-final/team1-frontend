<script setup>
/**
 * MasterListToolbar -- masterAdmin 목록 화면 공통 검색/셀렉트 툴바
 *
 * props:
 *   searchValue       (String) -- 현재 검색어
 *   searchPlaceholder (String) -- 검색 input placeholder
 *   searchWidth       (String) -- 검색창 너비 (예: '260px')
 *   filters           (Array)  -- [{ key, value, placeholder, options }]
 *
 * emits:
 *   update:searchValue(value)     -- 검색어 변경
 *   update:filter({ key, value }) -- 특정 select 필터 변경
 *
 * filters.options 형식:
 *   - ['A', 'B'] 같은 문자열 배열
 *   - [{ label: 'Amazon FBM', value: 'AMAZON' }] 같은 객체 배열
 */
defineProps({
  searchValue: {
    type: String,
    default: '',
  },
  searchPlaceholder: {
    type: String,
    default: '',
  },
  searchWidth: {
    type: String,
    default: '240px',
  },
  filters: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['update:searchValue', 'update:filter'])

function optionLabel(option) {
  return typeof option === 'object' ? option.label : option
}

function optionValue(option) {
  return typeof option === 'object' ? option.value : option
}
</script>

<template>
  <div class="toolbar-right">
    <div class="search-box" :style="{ width: searchWidth }">
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#B0B8CC" stroke-width="1.6">
        <circle cx="6" cy="6" r="4.5" />
        <path d="M10 10l2.5 2.5" stroke-linecap="round" />
      </svg>
      <input
        :value="searchValue"
        class="search-input"
        type="text"
        :placeholder="searchPlaceholder"
        @input="emit('update:searchValue', $event.target.value)"
      />
    </div>

    <select
      v-for="filter in filters"
      :key="filter.key"
      :value="filter.value"
      class="select-filter"
      @change="emit('update:filter', { key: filter.key, value: $event.target.value })"
    >
      <option value="">{{ filter.placeholder }}</option>
      <option
        v-for="option in filter.options"
        :key="optionValue(option)"
        :value="optionValue(option)"
      >
        {{ optionLabel(option) }}
      </option>
    </select>
  </div>
</template>

<style scoped>
.toolbar-right {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.search-box {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 14px;
  height: 36px;
  border: 1px solid var(--border);
  border-radius: 4px;
  background: var(--surface);
  transition: border-color var(--ease-fast);
}

.search-box:focus-within {
  border-color: var(--blue);
}

.search-input {
  border: none;
  outline: none;
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  color: var(--t1);
  background: transparent;
  flex: 1;
}

.search-input::placeholder {
  color: var(--t4);
}

.select-filter {
  height: 36px;
  padding: 0 12px;
  border: 1px solid var(--border);
  border-radius: 4px;
  background: var(--surface);
  font-family: 'Barlow', sans-serif;
  font-size: 13px;
  color: var(--t2);
  outline: none;
  cursor: pointer;
  transition: border-color var(--ease-fast);
}

.select-filter:focus {
  border-color: var(--blue);
}
</style>
