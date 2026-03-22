/**
 * Seller 전용 모달 셸에서 사용하는 규격 프리셋.
 * 공통 모달과 분리해 Seller 범위 안에서만 관리한다.
 */
export const SELLER_MODAL_SIZE_PRESETS = {
  compact: {
    width: '420px',
    maxHeight: 'min(560px, 90vh)',
  },
  default: {
    width: '520px',
    maxHeight: 'min(680px, 90vh)',
  },
  tall: {
    width: '720px',
    maxHeight: 'min(820px, 90vh)',
  },
}

export function getSellerModalSizePreset(size = 'default') {
  return SELLER_MODAL_SIZE_PRESETS[size] ?? SELLER_MODAL_SIZE_PRESETS.default
}

export function buildSellerModalPanelStyle({ size = 'default', width = '' } = {}) {
  const preset = getSellerModalSizePreset(size)

  return {
    width: width || preset.width,
    maxWidth: 'calc(100vw - 32px)',
    maxHeight: preset.maxHeight,
  }
}
