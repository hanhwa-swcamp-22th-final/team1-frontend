<script setup>
import { ref } from 'vue'
import BaseModal from '@/components/common/BaseModal.vue'

const props = defineProps({
  isOpen: { type: Boolean, required: true },
  asn:    { type: Object,  default: null  },
})

const emit = defineEmits(['cancel', 'confirm'])

const handleStatus = ref('셀러 알림 후 검수 보류')
const reason       = ref('파손')
const memo         = ref('')

const HANDLE_STATUSES = ['셀러 알림 후 검수 보류', '부족분 확정', '재검수 요청']
const REASONS         = ['파손', '오배송', '수량 부족', '기타']

function handleConfirm() {
  emit('confirm', { handleStatus: handleStatus.value, reason: reason.value, memo: memo.value })
  memo.value = ''
}
</script>

<template>
  <BaseModal
    title="ASN 수량 불일치 처리"
    :is-open="isOpen"
    width="580px"
    @cancel="emit('cancel')"
  >
    <div v-if="asn">

      <!-- ── Hero ─────────────────────────────────── -->
      <div class="modal-hero">
        <div class="modal-hero-top">
          <div>
            <div class="modal-eyebrow">Mismatch Resolution</div>
            <div class="modal-hero-title">
              실검수 {{ (asn.plannedQty - asn.actualQty)?.toLocaleString() }}EA 부족
            </div>
            <div class="modal-hero-copy">
              예정 수량과 실검수 수량 차이를 즉시 기록하고, 셀러 알림 및 보류/확정 여부를 결정합니다.
            </div>
          </div>
          <span class="badge badge--red">불일치 발생</span>
        </div>

        <!-- 요약 데이터 3개 -->
        <div class="data-grid">
          <div class="data-card">
            <span class="data-label">SKU</span>
            <div class="data-value code-cell">{{ asn.sku.split(' 외')[0] }}</div>
          </div>
          <div class="data-card">
            <span class="data-label">예정 / 실검수</span>
            <div class="data-value">{{ asn.plannedQty?.toLocaleString() }} / {{ asn.actualQty?.toLocaleString() }}</div>
          </div>
          <div class="data-card">
            <span class="data-label">차이</span>
            <div class="data-value text-red">-{{ (asn.plannedQty - asn.actualQty)?.toLocaleString() }} EA</div>
          </div>
        </div>
      </div>

      <!-- ── 상세 테이블 ───────────────────────────── -->
      <div class="modal-section">
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>SKU</th>
                <th>예정</th>
                <th>실검수</th>
                <th>차이</th>
                <th>사유</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><span class="code-cell">{{ asn.sku }}</span></td>
                <td>{{ asn.plannedQty?.toLocaleString() }}</td>
                <td class="text-red fw-700">{{ asn.actualQty?.toLocaleString() }}</td>
                <td><span class="badge badge--red">-{{ (asn.plannedQty - asn.actualQty)?.toLocaleString() }}</span></td>
                <td>파손 / 누락 의심</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- ── 처리 폼 ────────────────────────────────── -->
      <div class="modal-section">
        <div class="modal-surface">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">처리 상태</label>
              <select v-model="handleStatus" class="form-select">
                <option v-for="s in HANDLE_STATUSES" :key="s" :value="s">{{ s }}</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">불량 사유</label>
              <select v-model="reason" class="form-select">
                <option v-for="r in REASONS" :key="r" :value="r">{{ r }}</option>
              </select>
            </div>
          </div>
          <div class="form-group memo-group">
            <label class="form-label">관리 메모</label>
            <textarea
              v-model="memo"
              class="form-textarea"
              placeholder="박스 외부 찢김 확인. 작업자 업로드 사진 2장 첨부됨."
            />
          </div>
        </div>
      </div>

      <!-- ── 위험 Callout ──────────────────────────── -->
      <div class="callout callout--danger">
        <div class="callout-title">즉시 반영 사항</div>
        <div class="callout-copy">
          불일치 확정 시 셀러 알림이 생성되고, 차이 수량은 빨간색 강조 상태로 ASN 결과 화면에 반영됩니다.
        </div>
      </div>

    </div>

    <template #footer>
      <button class="ui-btn ui-btn--ghost" @click="emit('cancel')">취소</button>
      <button class="ui-btn ui-btn--primary" @click="handleConfirm">처리 완료</button>
    </template>
  </BaseModal>
</template>

<style scoped>
/* ── Hero ─────────────────────────────────────── */
.modal-hero {
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: var(--space-5);
  margin-bottom: var(--space-5);
}
.modal-hero-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--space-4);
  margin-bottom: var(--space-4);
}
.modal-eyebrow {
  font-size: 11px;
  font-weight: 600;
  color: var(--t3);
  letter-spacing: 0.07em;
  text-transform: uppercase;
  margin-bottom: 6px;
}
.modal-hero-title {
  font-family: var(--font-condensed);
  font-size: var(--font-size-xl);
  font-weight: 700;
  color: var(--t1);
  margin-bottom: 6px;
}
.modal-hero-copy {
  font-size: var(--font-size-xs);
  color: var(--t3);
  line-height: 1.55;
}

/* ── Data Grid (3 cols) ───────────────────────── */
.data-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-3);
}
.data-card {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: var(--space-3) var(--space-4);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
}
.data-label { font-size: 11px; color: var(--t3); font-weight: 500; }
.data-value { font-size: var(--font-size-md); font-weight: 700; color: var(--t1); }

/* ── Section ──────────────────────────────────── */
.modal-section { margin-bottom: var(--space-5); }
.modal-section:last-child { margin-bottom: 0; }

/* ── Table ────────────────────────────────────── */
.table-wrap { overflow-x: auto; }
.table-wrap table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--font-size-sm);
}
.table-wrap th {
  padding: 8px 12px;
  text-align: left;
  font-size: var(--font-size-xs);
  font-weight: 600;
  color: var(--t3);
  background: var(--surface-2);
  border-bottom: 1px solid var(--border);
}
.table-wrap td {
  padding: 10px 12px;
  border-bottom: 1px solid var(--border);
  color: var(--t1);
}
.table-wrap tr:last-child td { border-bottom: none; }

/* ── Form ─────────────────────────────────────── */
.modal-surface {
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: var(--space-4);
}
.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-4);
}
.form-group { display: flex; flex-direction: column; gap: var(--space-2); }
.memo-group { margin-top: var(--space-4); }
.form-label { font-size: var(--font-size-xs); font-weight: 600; color: var(--t2); }
.form-select {
  height: 36px;
  padding: 0 10px;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--surface);
  color: var(--t1);
  font-size: var(--font-size-sm);
  outline: none;
  transition: border-color var(--ease-fast);
}
.form-select:focus { border-color: var(--blue); }
.form-textarea {
  width: 100%;
  min-height: 72px;
  padding: 8px 12px;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--surface);
  color: var(--t1);
  font-size: var(--font-size-sm);
  resize: vertical;
  box-sizing: border-box;
  font-family: inherit;
  line-height: 1.5;
  outline: none;
  transition: border-color var(--ease-fast);
}
.form-textarea:focus { border-color: var(--blue); }

/* ── Callout ──────────────────────────────────── */
.callout {
  padding: var(--space-4);
  border-radius: var(--radius-md);
  border: 1px solid var(--border);
}
.callout--danger {
  background: var(--red-pale);
  border-color: rgba(239, 68, 68, 0.3);
}
.callout-title { font-size: var(--font-size-sm); font-weight: 700; color: var(--red); margin-bottom: 4px; }
.callout-copy  { font-size: var(--font-size-xs); color: var(--t2); line-height: 1.55; }

/* ── Helpers ──────────────────────────────────── */
.badge {
  display: inline-flex;
  align-items: center;
  padding: 3px 10px;
  border-radius: var(--radius-full);
  font-size: var(--font-size-xs);
  font-weight: 600;
  white-space: nowrap;
}
.badge--red   { background: var(--red-pale);   color: var(--red); }
.badge--amber { background: var(--amber-pale); color: #b45309; }
.code-cell { font-family: var(--font-mono); font-size: 12px; color: var(--t3); }
.text-red  { color: var(--red); }
.fw-700    { font-weight: 700; }
</style>
