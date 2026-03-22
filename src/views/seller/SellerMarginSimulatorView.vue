<script setup>
/**
 * 셀러 마진 시뮬레이터 화면.
 * 상품, 채널, 운송 조건을 바꾸면 우측 수익성과 비용 구성이 즉시 갱신된다.
 */
import { computed, reactive, watch } from 'vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import BaseForm from '@/components/common/BaseForm.vue'
import {
  buildMarginScenarioCards,
  calculateMarginResult,
  createInitialMarginForm,
  getMarginChannelByKey,
  getMarginProductBySku,
  getProductShippingCost,
  SELLER_MARGIN_CHANNEL_OPTIONS,
  SELLER_MARGIN_PRODUCT_OPTIONS,
  SELLER_MARGIN_SHIPPING_OPTIONS,
} from '@/utils/seller/marginSimulator.utils.js'

const breadcrumb = [{ label: 'Seller' }, { label: '마진 시뮬레이터' }]

// TODO(frontend): 상품별 실제 비용 기준과 채널 수수료 preset API를 연결한다.
// 시뮬레이터 입력값은 현재 화면에서만 유지한다.
const form = reactive(createInitialMarginForm())

const currentProduct = computed(() => getMarginProductBySku(form.productSku))
const result = computed(() => calculateMarginResult(form))
const scenarioCards = computed(() => buildMarginScenarioCards(form))
const maxBreakdownValue = computed(() => {
  return Math.max(...result.value.breakdown.map((item) => item.value), 1)
})

function formatUsd(value) {
  return `$${Number(value || 0).toFixed(2)}`
}

function formatPercent(value) {
  return `${Number(value || 0).toFixed(1)}%`
}

// 상품이 바뀌면 원가, 신고가, 기본 물류비 같은 추천값을 다시 불러온다.
watch(
  () => form.productSku,
  (sku) => {
    const product = getMarginProductBySku(sku)
    if (!product) return

    form.salePrice = product.defaultSalePrice
    form.fulfillmentFee = product.fulfillmentFee
    form.storageUnitCost = product.storageUnitCost
    form.declaredValue = product.declaredValue
    form.productCost = product.productCost
    form.packagingCost = product.packagingCost
    form.internationalShippingFee = getProductShippingCost(product, form.shippingMode)
  },
)

// 채널이 바뀌면 해당 채널 기본 수수료율을 다시 불러온다.
watch(
  () => form.salesChannel,
  (channelKey) => {
    const channel = getMarginChannelByKey(channelKey)
    if (!channel) return
    form.channelFeeRate = channel.defaultFeeRate
  },
)

// 운송 방식이 바뀌면 선택한 상품 기준 기본 국제 배송비를 다시 반영한다.
watch(
  () => form.shippingMode,
  (shippingMode) => {
    form.internationalShippingFee = getProductShippingCost(currentProduct.value, shippingMode)
  },
)

function resetForm() {
  Object.assign(form, createInitialMarginForm())
}
</script>

<template>
  <AppLayout title="마진 시뮬레이터" :breadcrumb="breadcrumb">
    <section class="seller-margin-simulator-page">
      <div class="simulator-grid">
        <div class="form-panel">
          <section class="panel-card">
            <header class="panel-header">
              <div>
                <p class="section-eyebrow">Margin Inputs</p>
                <h2 class="section-title">상품 선택</h2>
              </div>
            </header>

            <div class="form-grid">
              <BaseForm label="상품 SKU" required>
                <select v-model="form.productSku">
                  <option
                    v-for="product in SELLER_MARGIN_PRODUCT_OPTIONS"
                    :key="product.sku"
                    :value="product.sku"
                  >
                    {{ product.sku }} · {{ product.productName }}
                  </option>
                </select>
              </BaseForm>

              <BaseForm label="판매 채널" required>
                <select v-model="form.salesChannel">
                  <option
                    v-for="channel in SELLER_MARGIN_CHANNEL_OPTIONS"
                    :key="channel.key"
                    :value="channel.key"
                  >
                    {{ channel.label }}
                  </option>
                </select>
              </BaseForm>

              <BaseForm label="운송 모드" required>
                <select v-model="form.shippingMode">
                  <option
                    v-for="option in SELLER_MARGIN_SHIPPING_OPTIONS"
                    :key="option.key"
                    :value="option.key"
                  >
                    {{ option.label }}
                  </option>
                </select>
              </BaseForm>
            </div>
          </section>

          <section class="panel-card">
            <header class="panel-header">
              <h2 class="panel-title">판매 정보</h2>
            </header>

            <div class="form-grid">
              <BaseForm label="판매가 (USD)" required>
                <input v-model="form.salePrice" type="number" min="0" step="0.01" />
              </BaseForm>

              <BaseForm label="채널 수수료율 (%)" required>
                <input v-model="form.channelFeeRate" type="number" min="0" step="0.1" />
              </BaseForm>
            </div>
          </section>

          <section class="panel-card">
            <header class="panel-header">
              <h2 class="panel-title">물류비 (USD)</h2>
            </header>

            <div class="form-grid">
              <BaseForm label="CONK 풀필먼트 수수료" required>
                <input v-model="form.fulfillmentFee" type="number" min="0" step="0.01" />
              </BaseForm>

              <BaseForm label="기준 국제 배송비" required>
                <input v-model="form.internationalShippingFee" type="number" min="0" step="0.01" />
              </BaseForm>

              <BaseForm label="월 기타 비용">
                <input v-model="form.otherCost" type="number" min="0" step="0.01" />
              </BaseForm>

              <BaseForm label="월 예상 판매 수량" required>
                <input v-model="form.monthlySalesQty" type="number" min="1" step="1" />
              </BaseForm>

              <BaseForm label="보관비 단가" required>
                <input v-model="form.storageUnitCost" type="number" min="0" step="0.01" />
              </BaseForm>
            </div>
          </section>

          <section class="panel-card">
            <header class="panel-header">
              <h2 class="panel-title">통관 비용</h2>
            </header>

            <div class="form-grid">
              <BaseForm label="신고가 기준" required>
                <input v-model="form.declaredValue" type="number" min="0" step="0.01" />
              </BaseForm>

              <BaseForm label="관세 입력 방식" required>
                <select v-model="form.dutyMode">
                  <option value="rate">관세율</option>
                  <option value="amount">관세액 직접 입력</option>
                </select>
              </BaseForm>

              <BaseForm label="부가세율 (%)" required>
                <input v-model="form.vatRate" type="number" min="0" step="0.1" />
              </BaseForm>

              <BaseForm v-if="form.dutyMode === 'rate'" label="관세율 (%)" required>
                <input v-model="form.dutyRate" type="number" min="0" step="0.1" />
              </BaseForm>

              <BaseForm v-else label="관세액 직접 입력" required>
                <input v-model="form.dutyAmount" type="number" min="0" step="0.01" />
              </BaseForm>
            </div>
          </section>

          <section class="panel-card">
            <header class="panel-header">
              <h2 class="panel-title">원가</h2>
            </header>

            <div class="form-grid">
              <BaseForm label="매입 원가" required>
                <input v-model="form.productCost" type="number" min="0" step="0.01" />
              </BaseForm>

              <BaseForm label="포장비" required>
                <input v-model="form.packagingCost" type="number" min="0" step="0.01" />
              </BaseForm>
            </div>

            <div class="panel-actions">
              <button class="ui-btn ui-btn--ghost" type="button" @click="resetForm">
                기본값 복원
              </button>
            </div>
          </section>
        </div>

        <div class="result-panel">
          <article class="summary-card">
            <p class="summary-eyebrow">Estimated Result</p>
            <h2 class="summary-title">{{ currentProduct?.productName ?? '선택된 상품 없음' }}</h2>

            <div class="summary-grid">
              <div class="summary-item">
                <span class="summary-label">예상 매출</span>
                <strong class="summary-value">{{ formatUsd(result.revenue) }}</strong>
              </div>

              <div class="summary-item">
                <span class="summary-label">총 비용</span>
                <strong class="summary-value">{{ formatUsd(result.totalCost) }}</strong>
              </div>

              <div class="summary-item">
                <span class="summary-label">순이익</span>
                <strong class="summary-value">{{ formatUsd(result.netProfit) }}</strong>
              </div>

              <div class="summary-item">
                <span class="summary-label">마진율</span>
                <strong class="summary-value">{{ formatPercent(result.marginRate) }}</strong>
              </div>
            </div>

            <div class="summary-bep">
              <span>손익분기점 (BEP)</span>
              <strong>{{ result.breakEvenUnits ? `${result.breakEvenUnits}개` : '달성 불가' }}</strong>
            </div>
          </article>

          <article class="panel-card">
            <header class="panel-header">
              <h2 class="panel-title">수익 구조 분해</h2>
            </header>

            <div class="breakdown-list">
              <div v-for="item in result.breakdown" :key="item.key" class="breakdown-item">
                <div class="breakdown-row">
                  <span class="breakdown-label">{{ item.label }}</span>
                  <strong class="breakdown-value">{{ formatUsd(item.value) }}</strong>
                </div>

                <div class="breakdown-track">
                  <div
                    class="breakdown-bar"
                    :class="`breakdown-bar--${item.tone}`"
                    :style="{ width: `${(item.value / maxBreakdownValue) * 100}%` }"
                  />
                </div>
              </div>
            </div>
          </article>

          <article class="panel-card">
            <header class="panel-header">
              <h2 class="panel-title">비용 상세 내역</h2>
            </header>

            <table class="detail-table">
              <thead>
                <tr>
                  <th>항목</th>
                  <th>금액</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in result.breakdown" :key="item.key">
                  <td>{{ item.label }}</td>
                  <td>{{ formatUsd(item.value) }}</td>
                </tr>
              </tbody>
            </table>
          </article>

          <article class="panel-card">
            <header class="panel-header">
              <h2 class="panel-title">시나리오 비교</h2>
            </header>

            <div class="scenario-grid">
              <div
                v-for="scenario in scenarioCards"
                :key="scenario.key"
                class="scenario-card"
                :class="{ 'scenario-card--negative': scenario.netProfit < 0 }"
              >
                <span class="scenario-label">{{ scenario.label }}</span>
                <strong class="scenario-value">{{ formatUsd(scenario.netProfit) }}</strong>
                <span class="scenario-meta">
                  {{ scenario.shippingLabel }} · {{ formatPercent(scenario.marginRate) }}
                </span>
              </div>
            </div>
          </article>
        </div>
      </div>
    </section>
  </AppLayout>
</template>

<style scoped>
.seller-margin-simulator-page {
  display: flex;
  flex-direction: column;
}

.simulator-grid {
  display: grid;
  grid-template-columns: minmax(360px, 480px) minmax(0, 1fr);
  gap: var(--space-5);
}

.form-panel,
.result-panel {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.panel-card {
  padding: var(--space-6);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  background: var(--surface);
  box-shadow: var(--shadow-sm);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--space-3);
  margin-bottom: var(--space-4);
}

.section-eyebrow {
  margin: 0 0 var(--space-2);
  color: var(--blue);
  font-size: var(--font-size-xs);
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.section-title,
.panel-title {
  margin: 0;
  color: var(--t1);
  font-size: var(--font-size-lg);
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-4);
}

:deep(.field-control input),
:deep(.field-control select),
.form-grid input,
.form-grid select {
  width: 100%;
  height: 40px;
  padding: 0 12px;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--surface);
  color: var(--t1);
  font-size: var(--font-size-sm);
}

.form-grid input:focus,
.form-grid select:focus {
  outline: none;
  border-color: var(--blue);
  box-shadow: 0 0 0 3px var(--blue-pale);
}

.panel-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: var(--space-4);
}

.summary-card {
  padding: var(--space-6);
  border-radius: var(--radius-lg);
  background: linear-gradient(140deg, #1a1a2e 0%, #252540 100%);
  color: #fff;
  box-shadow: var(--shadow-md);
}

.summary-eyebrow {
  margin: 0 0 var(--space-2);
  color: rgba(255, 255, 255, 0.7);
  font-size: var(--font-size-xs);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.summary-title {
  margin: 0 0 var(--space-5);
  font-family: var(--font-condensed);
  font-size: 28px;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-4);
}

.summary-item {
  padding: var(--space-4);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: var(--radius-md);
  background: rgba(255, 255, 255, 0.04);
}

.summary-label {
  display: block;
  margin-bottom: var(--space-2);
  color: rgba(255, 255, 255, 0.72);
  font-size: var(--font-size-sm);
}

.summary-value {
  font-family: var(--font-condensed);
  font-size: 30px;
}

.summary-bep {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: var(--space-5);
  padding-top: var(--space-4);
  border-top: 1px solid rgba(255, 255, 255, 0.12);
  font-size: var(--font-size-sm);
}

.summary-bep strong {
  font-size: var(--font-size-lg);
}

.breakdown-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.breakdown-row {
  display: flex;
  justify-content: space-between;
  gap: var(--space-3);
  margin-bottom: var(--space-2);
}

.breakdown-label {
  color: var(--t2);
  font-size: var(--font-size-sm);
}

.breakdown-value {
  color: var(--t1);
  font-size: var(--font-size-sm);
}

.breakdown-track {
  width: 100%;
  height: 10px;
  border-radius: var(--radius-full);
  background: var(--surface-2);
  overflow: hidden;
}

.breakdown-bar {
  height: 100%;
  border-radius: inherit;
}

.breakdown-bar--gold {
  background: var(--gold);
}

.breakdown-bar--blue {
  background: var(--blue);
}

.breakdown-bar--purple {
  background: var(--purple);
}

.breakdown-bar--green {
  background: var(--green);
}

.breakdown-bar--red {
  background: var(--red);
}

.breakdown-bar--amber {
  background: var(--amber);
}

.breakdown-bar--default {
  background: var(--t4);
}

.detail-table {
  width: 100%;
  border-collapse: collapse;
}

.detail-table th,
.detail-table td {
  padding: 12px 0;
  border-bottom: 1px solid var(--border);
  text-align: left;
  font-size: var(--font-size-sm);
}

.detail-table th:last-child,
.detail-table td:last-child {
  text-align: right;
}

.detail-table tbody tr:last-child td {
  border-bottom: none;
}

.scenario-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--space-3);
}

.scenario-card {
  padding: var(--space-4);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--surface-2);
}

.scenario-card--negative {
  border-color: var(--red);
  background: var(--red-pale);
}

.scenario-label {
  display: block;
  margin-bottom: var(--space-2);
  color: var(--t3);
  font-size: var(--font-size-sm);
  font-weight: 600;
}

.scenario-value {
  display: block;
  margin-bottom: var(--space-2);
  color: var(--t1);
  font-family: var(--font-condensed);
  font-size: 24px;
}

.scenario-meta {
  color: var(--t3);
  font-size: var(--font-size-sm);
}

@media (max-width: 1240px) {
  .simulator-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 820px) {
  .form-grid,
  .summary-grid,
  .scenario-grid {
    grid-template-columns: 1fr;
  }
}
</style>
