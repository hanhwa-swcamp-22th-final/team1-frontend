<script setup>
/**
 * 셀러 상품 등록 화면.
 * Pigma 상품 등록 시안을 기준으로 입력 섹션과 우측 설정 카드를 구성하고 mock 저장까지 연결한다.
 */
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { createSellerProduct, getSellerProductDetail, getSellerProductOptions, updateSellerProduct } from '@/api/wms'
import AppLayout from '@/components/layout/AppLayout.vue'
import BaseForm from '@/components/common/BaseForm.vue'
import FileUpload from '@/components/common/FileUpload.vue'
import {
  buildProductFormFromProduct,
  buildSellerProductPayload,
  buildVolumeWeight,
  createInitialProductErrors,
  createInitialProductForm,
  validateProductForm,
} from '@/utils/seller/productRegister.utils.js'

const route = useRoute()
const editingProductId = computed(() => String(route.query.productId ?? '').trim())
const isEditMode = computed(() => Boolean(editingProductId.value))
const pageTitle = computed(() => (isEditMode.value ? '상품 수정' : '상품 등록'))
const submitButtonLabel = computed(() => {
  if (isSubmitting.value) return isEditMode.value ? '수정 중...' : '등록 중...'
  return isEditMode.value ? '상품 수정' : '상품 등록'
})
const breadcrumb = computed(() => [{ label: 'Seller' }, { label: pageTitle.value }])

// 상품 등록 입력값과 에러를 화면에 직접 바인딩한다.
const productForm = ref(createInitialProductForm())
const fieldErrors = reactive(createInitialProductErrors())

// 이미지 업로드는 현재 단계에서 파일명만 미리보기한다.
const selectedImages = ref([])
const isSubmitting = ref(false)
const isLoadingEditProduct = ref(false)
const categoryOptions = ref([])
const hsCodeOptions = ref([])
const originOptions = ref([])
const optionsErrorMessage = ref('')

// 버튼 클릭 후 사용자에게 보여줄 안내 문구를 구분해서 관리한다.
const infoMessage = ref('')
const successMessage = ref('')
const errorMessage = ref('')

// 치수 입력이 있으면 부피중량을 자동 계산해 읽기 전용 필드에 표시한다.
const volumeWeight = computed(() => {
  return buildVolumeWeight(productForm.value.length, productForm.value.width, productForm.value.height)
})

// 우측 이미지 슬롯은 최대 3칸까지만 노출한다.
const imageSlots = computed(() => {
  return Array.from({ length: 3 }, (_, index) => selectedImages.value[index] ?? null)
})

// 화면 메시지는 한 번에 하나만 보이도록 초기화한다.
function clearMessages() {
  infoMessage.value = ''
  successMessage.value = ''
  errorMessage.value = ''
  optionsErrorMessage.value = ''
}

// 상품 등록 검증 결과를 다시 보여주기 전 기존 에러를 비운다.
function clearFieldErrors() {
  const nextErrors = createInitialProductErrors()
  Object.keys(fieldErrors).forEach((key) => {
    fieldErrors[key] = nextErrors[key]
  })
}

// 현재 입력값과 이미지 미리보기를 초기 상태로 되돌린다.
function resetProductForm() {
  productForm.value = createInitialProductForm()
  selectedImages.value = []
  clearFieldErrors()
}

function applyEditableProduct(product) {
  productForm.value = buildProductFormFromProduct(product)
  selectedImages.value = Array.isArray(product.detail?.imageNames)
    ? product.detail.imageNames.slice(0, 3).map((name, index) => ({
        id: `product-image-${index + 1}`,
        name,
      }))
    : []
  clearFieldErrors()
}

// 취소 버튼은 로컬 상태만 초기화하고 안내 메시지를 남긴다.
function handleCancel() {
  clearMessages()

  if (isEditMode.value) {
    void loadEditableProduct()
    infoMessage.value = '상품 수정 입력을 초기화했습니다.'
    return
  }

  resetProductForm()
  infoMessage.value = '작성 중인 상품 입력을 초기화했습니다.'
}

// 이미지 업로드는 최대 3장까지만 화면 슬롯에 표시한다.
function handleImageSelected(files) {
  const targetFiles = Array.isArray(files) ? files : [files]

  clearMessages()
  selectedImages.value = targetFiles
    .filter(Boolean)
    .slice(0, 3)
    .map((file, index) => ({
      id: `product-image-${index + 1}`,
      name: file.name,
    }))

  if (!selectedImages.value.length) return

  infoMessage.value = targetFiles.length > 3
    ? '이미지는 최대 3장까지 미리보기합니다.'
    : `${selectedImages.value.length}장의 상품 이미지를 화면에 반영했습니다.`
}

// 토글형 판매 설정은 로컬 상태에서만 on/off 를 바꾼다.
function handleToggle(fieldKey) {
  productForm.value[fieldKey] = !productForm.value[fieldKey]
}

// 바코드 스캔과 HS 조회는 다음 단계 연결 예정이라 안내 메시지만 보여준다.
function showHelperMessage(message) {
  clearMessages()
  infoMessage.value = message
}

// 임시저장은 실제 저장 없이 현재 상품 초안이 준비되었다는 메시지만 보여준다.
function handleDraftSave() {
  clearMessages()

  const productLabel = productForm.value.productName || productForm.value.sku || '신규 상품'
  // TODO(frontend): 상품 임시저장 API를 연결한다.
  infoMessage.value = `${productLabel} 초안을 임시저장했습니다. 실제 저장은 다음 단계에서 연결합니다.`
}

function normalizeOptionList(items = []) {
  return (Array.isArray(items) ? items : []).map((item) => {
    if (typeof item === 'string') {
      return { value: item, label: item }
    }

    const value = String(item?.value ?? item?.code ?? item?.id ?? item?.key ?? item?.name ?? '').trim()
    const label = String(item?.label ?? item?.name ?? item?.value ?? item?.code ?? value).trim()
    return { value, label }
  }).filter((item) => item.value)
}

// 최종 등록은 필수 입력을 검증한 뒤 mock-server 상품 등록 API를 호출한다.
async function handleSubmit() {
  clearMessages()
  clearFieldErrors()

  const errors = validateProductForm(productForm.value)
  Object.entries(errors).forEach(([key, value]) => {
    fieldErrors[key] = value
  })

  if (Object.values(errors).some(Boolean)) {
    errorMessage.value = '필수 입력값을 확인한 뒤 다시 저장하세요.'
    return
  }

  const productLabel = productForm.value.productName || productForm.value.sku

  try {
    isSubmitting.value = true
    const payload = buildSellerProductPayload(productForm.value, {
      imageNames: selectedImages.value.map((image) => image.name),
    })
    const response = isEditMode.value
      ? await updateSellerProduct(editingProductId.value, payload)
      : await createSellerProduct(payload)

    if (isEditMode.value) {
      applyEditableProduct(response.data?.data ?? { ...payload, detail: payload })
      successMessage.value = response.data?.message ?? `${productLabel} 상품 정보가 수정되었습니다.`
      return
    }

    resetProductForm()
    successMessage.value = response.data?.message ?? `${productLabel} 상품이 등록되었습니다.`
  } catch (error) {
    errorMessage.value = error.response?.data?.message ?? (
      isEditMode.value
        ? '상품 수정 중 오류가 발생했습니다.'
        : '상품 등록 중 오류가 발생했습니다.'
    )
  } finally {
    isSubmitting.value = false
  }
}

async function loadEditableProduct() {
  clearMessages()

  if (!isEditMode.value) {
    resetProductForm()
    return
  }

  try {
    isLoadingEditProduct.value = true
    const response = await getSellerProductDetail(editingProductId.value)
    applyEditableProduct(response.data?.data ?? {})
  } catch (error) {
    resetProductForm()
    errorMessage.value = error.response?.data?.message ?? '상품 정보를 불러오는 중 오류가 발생했습니다.'
  } finally {
    isLoadingEditProduct.value = false
  }
}

async function fetchProductOptions() {
  optionsErrorMessage.value = ''

  try {
    const response = await getSellerProductOptions()
    const payload = response.data?.data ?? {}
    categoryOptions.value = normalizeOptionList(payload.categories)
    hsCodeOptions.value = normalizeOptionList(payload.hsCodes)
    originOptions.value = normalizeOptionList(payload.originCountries)
  } catch (error) {
    categoryOptions.value = []
    hsCodeOptions.value = []
    originOptions.value = []
    optionsErrorMessage.value = error.response?.data?.message ?? '상품 등록 옵션을 불러오지 못했습니다.'
  }
}

watch(() => editingProductId.value, () => {
  void loadEditableProduct()
}, { immediate: true })

onMounted(() => {
  void fetchProductOptions()
})
</script>

<template>
  <AppLayout :title="pageTitle" :breadcrumb="breadcrumb">
    <section class="seller-product-register-page">
      <form class="product-layout" @submit.prevent="handleSubmit">
        <div class="product-main">
          <!-- 기본 식별 정보와 카테고리를 먼저 입력하는 카드 -->
          <section class="panel-card">
            <header class="panel-header">
              <span class="panel-accent" aria-hidden="true" />
              <h2 class="panel-title">기본 정보</h2>
            </header>

            <div class="form-grid form-grid--2">
              <BaseForm label="SKU" required :error="fieldErrors.sku">
                <input v-model="productForm.sku" type="text" placeholder="예: LB-AMP-30" />
              </BaseForm>

              <BaseForm label="상품명" required :error="fieldErrors.productName">
                <input v-model="productForm.productName" type="text" placeholder="예: 루미에르 앰플 30ml" />
              </BaseForm>

              <BaseForm label="카테고리" required :error="fieldErrors.category">
                <select v-model="productForm.category">
                  <option value="">선택</option>
                  <option
                    v-for="category in categoryOptions"
                    :key="category.value"
                    :value="category.value"
                  >
                    {{ category.label }}
                  </option>
                </select>
              </BaseForm>

              <BaseForm label="브랜드">
                <input v-model="productForm.brand" type="text" />
              </BaseForm>

              <BaseForm class="form-span-2" label="상품 설명">
                <textarea
                  v-model="productForm.description"
                  rows="4"
                  placeholder="상품 설명을 입력하세요."
                />
              </BaseForm>
            </div>
          </section>

          <!-- 가격, 중량, 치수 입력과 자동 계산 부피중량 카드 -->
          <section class="panel-card">
            <header class="panel-header">
              <span class="panel-accent" aria-hidden="true" />
              <h2 class="panel-title">가격 · 중량 · 치수</h2>
            </header>

            <div class="form-grid form-grid--4">
              <BaseForm label="판매가(USD)" required :error="fieldErrors.salePrice">
                <input v-model="productForm.salePrice" type="number" min="0" step="0.01" placeholder="0.00" />
              </BaseForm>

              <BaseForm label="원가(USD)">
                <input v-model="productForm.costPrice" type="number" min="0" step="0.01" placeholder="0.00" />
              </BaseForm>

              <BaseForm label="중량(lbs)" required :error="fieldErrors.weight">
                <input v-model="productForm.weight" type="number" min="0" step="0.001" placeholder="0.000" />
              </BaseForm>

              <BaseForm label="부피중량(lbs)" hint="길이, 너비, 높이 기준 자동 계산">
                <input :value="volumeWeight" type="text" placeholder="자동계산" readonly />
              </BaseForm>
            </div>

            <div class="form-grid form-grid--3">
              <BaseForm label="길이(L/inch)" required :error="fieldErrors.length">
                <input v-model="productForm.length" type="number" min="0" step="0.1" placeholder="0" />
              </BaseForm>

              <BaseForm label="너비(W/inch)" required :error="fieldErrors.width">
                <input v-model="productForm.width" type="number" min="0" step="0.1" placeholder="0" />
              </BaseForm>

              <BaseForm label="높이(H/inch)" required :error="fieldErrors.height">
                <input v-model="productForm.height" type="number" min="0" step="0.1" placeholder="0" />
              </BaseForm>
            </div>
          </section>

          <!-- 통관 필드와 HS 코드 조회 자리만 먼저 구현한다. -->
          <section class="panel-card">
            <header class="panel-header">
              <span class="panel-accent" aria-hidden="true" />
              <h2 class="panel-title">통관 정보</h2>
            </header>

            <div class="form-grid form-grid--3">
              <BaseForm label="HS 코드" hint="선택 항목">
                <div class="field-with-action">
                  <select v-model="productForm.hsCode">
                    <option value="">선택 안 함</option>
                    <option
                      v-for="hsCode in hsCodeOptions"
                      :key="hsCode.value"
                      :value="hsCode.value"
                    >
                      {{ hsCode.label }}
                    </option>
                  </select>

                  <button
                    class="ui-btn ui-btn--ghost inline-btn"
                    type="button"
                    @click="showHelperMessage('HS 코드 조회 UI는 다음 단계에서 연결합니다.')"
                  >
                    조회
                  </button>
                </div>
              </BaseForm>

              <BaseForm label="원산지" required :error="fieldErrors.originCountry">
                <select v-model="productForm.originCountry">
                  <option value="">원산지를 선택하세요</option>
                  <option
                    v-for="origin in originOptions"
                    :key="origin.value"
                    :value="origin.value"
                  >
                    {{ origin.label }}
                  </option>
                </select>
              </BaseForm>

              <BaseForm label="신고가(USD)" required :error="fieldErrors.customsValue">
                <input v-model="productForm.customsValue" type="number" min="0" step="0.01" placeholder="0.00" />
              </BaseForm>
            </div>
          </section>

          <!-- Amazon 연동 코드는 ASIN만 입력할 수 있게 유지한다. -->
          <section class="panel-card">
            <header class="panel-header">
              <span class="panel-accent" aria-hidden="true" />
              <h2 class="panel-title">Amazon 연동</h2>
            </header>

            <div class="form-grid">
              <BaseForm label="ASIN (Amazon)">
                <input v-model="productForm.asin" type="text" placeholder="Amazon ASIN 코드" />
              </BaseForm>
            </div>
          </section>

          <div class="action-row">
            <button class="ui-btn ui-btn--ghost" type="button" @click="handleCancel">취소</button>
            <button class="ui-btn ui-btn--ghost" type="button" @click="handleDraftSave">임시저장</button>
            <button class="ui-btn ui-btn--primary" type="submit" :disabled="isSubmitting">
              {{ submitButtonLabel }}
            </button>
          </div>

          <p v-if="isLoadingEditProduct" class="page-message page-message--info">상품 정보를 불러오는 중입니다.</p>
          <p v-if="infoMessage" class="page-message page-message--info">{{ infoMessage }}</p>
          <p v-if="successMessage" class="page-message page-message--success">{{ successMessage }}</p>
          <p v-if="optionsErrorMessage" class="page-message page-message--error">{{ optionsErrorMessage }}</p>
          <p v-if="errorMessage" class="page-message page-message--error">{{ errorMessage }}</p>
        </div>

        <aside class="product-side">
          <!-- 실제 업로드 대신 파일명과 슬롯 미리보기로 이미지 카드만 먼저 구현한다. -->
          <section class="side-card">
            <header class="panel-header">
              <span class="panel-accent" aria-hidden="true" />
              <h2 class="panel-title">상품 이미지</h2>
            </header>

            <div class="image-upload">
              <FileUpload
                accept=".jpg,.jpeg,.png"
                :multiple="true"
                @file-selected="handleImageSelected"
              />
            </div>

            <p class="side-caption">JPG, PNG · 최대 5MB</p>

            <div class="image-slots">
              <div
                v-for="(slot, index) in imageSlots"
                :key="`image-slot-${index + 1}`"
                class="image-slot"
                :class="{ 'image-slot--filled': slot }"
              >
                <span v-if="slot" class="image-slot-name">{{ slot.name }}</span>
                <span v-else class="image-slot-plus">+</span>
              </div>
            </div>
          </section>

          <!-- 판매 설정은 토글형 UI만 먼저 제공한다. -->
          <section class="side-card">
            <header class="panel-header">
              <span class="panel-accent" aria-hidden="true" />
              <h2 class="panel-title">판매 설정</h2>
            </header>

            <div class="setting-list">
              <div class="setting-row">
                <div>
                  <p class="setting-title">판매 활성화</p>
                  <p class="setting-description">비활성 시 주문 불가</p>
                </div>

                <button
                  class="toggle-switch"
                  :class="{ 'toggle-switch--on': productForm.isActive }"
                  type="button"
                  :aria-pressed="productForm.isActive"
                  @click="handleToggle('isActive')"
                >
                  <span class="toggle-switch-thumb" />
                </button>
              </div>

              <div class="setting-row">
                <div>
                  <p class="setting-title">재고 부족 경고</p>
                  <p class="setting-description">임계치 이하 시 알림</p>
                </div>

                <button
                  class="toggle-switch"
                  :class="{ 'toggle-switch--on': productForm.lowStockAlert }"
                  type="button"
                  :aria-pressed="productForm.lowStockAlert"
                  @click="handleToggle('lowStockAlert')"
                >
                  <span class="toggle-switch-thumb" />
                </button>
              </div>

              <div class="setting-row setting-row--last">
                <div>
                  <p class="setting-title">Amazon 채널 연동</p>
                  <p class="setting-description">ASIN 연동 시 자동 수집</p>
                </div>

                <button
                  class="toggle-switch"
                  :class="{ 'toggle-switch--on': productForm.amazonSync }"
                  type="button"
                  :aria-pressed="productForm.amazonSync"
                  @click="handleToggle('amazonSync')"
                >
                  <span class="toggle-switch-thumb" />
                </button>
              </div>
            </div>
          </section>

          <!-- 재고 설정은 숫자 입력만 먼저 열어 둔다. -->
          <section class="side-card">
            <header class="panel-header">
              <span class="panel-accent" aria-hidden="true" />
              <h2 class="panel-title">재고 설정</h2>
            </header>

            <div class="side-form-stack">
              <BaseForm label="재고 경고 임계치">
                <div class="unit-input">
                  <input v-model="productForm.stockAlertThreshold" type="number" min="0" step="1" />
                  <span class="unit-label">개</span>
                </div>
              </BaseForm>

              <BaseForm label="최소 주문 수량">
                <div class="unit-input">
                  <input v-model="productForm.minOrderQuantity" type="number" min="1" step="1" />
                  <span class="unit-label">개</span>
                </div>
              </BaseForm>
            </div>
          </section>
        </aside>
      </form>
    </section>
  </AppLayout>
</template>

<style scoped>
.seller-product-register-page {
  display: flex;
  flex-direction: column;
}

.product-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 300px;
  gap: var(--space-5);
  align-items: start;
}

.product-main,
.product-side {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.panel-card,
.side-card {
  padding: var(--space-5) var(--space-6);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  background: var(--surface);
  box-shadow: var(--shadow-sm);
}

.panel-header {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-bottom: var(--space-4);
}

.panel-accent {
  width: 3px;
  height: 14px;
  border-radius: var(--radius-full);
  background: var(--gold);
}

.panel-title {
  color: var(--t1);
  font-family: var(--font-condensed);
  font-size: var(--font-size-lg);
  font-weight: 700;
  letter-spacing: 0.02em;
}

.form-grid {
  display: grid;
  gap: var(--space-3);
}

.form-grid--2 {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.form-grid--3 {
  grid-template-columns: repeat(3, minmax(0, 1fr));
  margin-top: var(--space-3);
}

.form-grid--4 {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.form-span-2 {
  grid-column: span 2;
}

.field-with-action {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: var(--space-2);
  align-items: center;
}

.inline-btn {
  white-space: nowrap;
}

.action-row {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-2);
  padding-top: var(--space-4);
  border-top: 1px solid var(--border);
}

.page-message {
  margin-top: calc(var(--space-2) * -1);
  font-size: var(--font-size-sm);
  font-weight: 600;
}

.page-message--info {
  color: var(--t3);
}

.page-message--success {
  color: var(--green);
}

.page-message--error {
  color: var(--red);
}

.image-upload :deep(.upload-zone) {
  min-height: 132px;
  padding: var(--space-5);
}

.side-caption {
  margin-top: var(--space-2);
  color: var(--t4);
  font-size: var(--font-size-xs);
}

.image-slots {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--space-2);
  margin-top: var(--space-3);
}

.image-slot {
  display: flex;
  align-items: center;
  justify-content: center;
  aspect-ratio: 1;
  padding: var(--space-2);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--surface-2);
  text-align: center;
}

.image-slot--filled {
  background: var(--gold-pale);
  border-color: var(--gold);
}

.image-slot-name {
  color: var(--t2);
  font-size: var(--font-size-xs);
  line-height: 1.4;
  word-break: break-word;
}

.image-slot-plus {
  color: var(--t4);
  font-size: var(--font-size-xl);
  font-weight: 600;
}

.setting-list {
  display: flex;
  flex-direction: column;
}

.setting-row {
  display: flex;
  justify-content: space-between;
  gap: var(--space-3);
  padding: var(--space-3) 0;
  border-bottom: 1px solid var(--border);
}

.setting-row--last {
  border-bottom: none;
  padding-bottom: 0;
}

.setting-title {
  color: var(--t2);
  font-size: var(--font-size-md);
}

.setting-description {
  margin-top: var(--space-1);
  color: var(--t4);
  font-size: var(--font-size-xs);
}

.toggle-switch {
  position: relative;
  width: 42px;
  height: 24px;
  padding: 0;
  border: none;
  border-radius: var(--radius-full);
  background: var(--border);
  cursor: pointer;
  transition: background var(--ease-fast);
}

.toggle-switch--on {
  background: var(--gold);
}

.toggle-switch-thumb {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--surface);
  box-shadow: var(--shadow-sm);
  transition: transform var(--ease-fast);
}

.toggle-switch--on .toggle-switch-thumb {
  transform: translateX(18px);
}

.side-form-stack {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.unit-input {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: var(--space-2);
  align-items: center;
}

.unit-label {
  color: var(--t3);
  font-size: var(--font-size-sm);
  font-weight: 600;
}

@media (max-width: 1280px) {
  .product-layout {
    grid-template-columns: 1fr;
  }

  .product-side {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: var(--space-4);
  }
}

@media (max-width: 1024px) {
  .form-grid--4,
  .form-grid--3,
  .form-grid--2,
  .product-side {
    grid-template-columns: 1fr;
  }

  .form-span-2 {
    grid-column: span 1;
  }
}
</style>
