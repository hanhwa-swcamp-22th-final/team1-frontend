/**
 * utils/excel.js — Excel 파일 파싱 및 다운로드
 *
 * 의존성: xlsx (SheetJS) v0.18.x
 *
 * ⚠️  주의사항:
 *   - xlsx 라이브러리는 번들 크기가 큼(~800KB). 동적 import 검토 권장.
 *   - 대용량 파일(5MB↑, 10만 행↑) 파싱 시 브라우저 메인 스레드 블로킹 가능.
 *     대용량 처리가 필요하면 Web Worker 방식으로 교체 필요.
 *   - parseExcel()은 첫 번째 시트만 읽음. 다른 시트 필요 시 수정 필요.
 *   - 헤더 행(1행)의 셀 값이 JSON 키가 됨. 공백·특수문자 주의.
 */

let xlsxModulePromise

function loadXlsx() {
  if (!xlsxModulePromise) {
    xlsxModulePromise = import('xlsx')
  }
  return xlsxModulePromise
}

/**
 * Excel 파일 파싱 → JSON 배열 변환
 * 첫 번째 시트(wb.SheetNames[0])만 처리.
 *
 * @param {File} file — input[type="file"] 또는 FileUpload.vue에서 받은 File 객체
 * @returns {Promise<Array<Object>>} 각 행이 { 컬럼명: 값 } 형태의 객체 배열
 *
 * 예시 결과:
 *   [
 *     { SKU: 'SKU-001', 수량: 100, 단가: 29.99 },
 *     { SKU: 'SKU-002', 수량: 50,  단가: 14.99 },
 *   ]
 *
 * 사용 예:
 *   import { parseExcel } from '@/utils/excel'
 *   const rows = await parseExcel(file)
 */
export function parseExcel(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        const XLSX = await loadXlsx()
        // ArrayBuffer로 읽어 xlsx 파싱 (type: 'array')
        const wb = XLSX.read(e.target.result, { type: 'array' })
        // 첫 번째 시트만 처리
        const ws = wb.Sheets[wb.SheetNames[0]]
        // defval: '' — 빈 셀을 null 대신 빈 문자열로 처리
        const data = XLSX.utils.sheet_to_json(ws, { defval: '' })
        resolve(data)
      } catch (err) {
        reject(err)
      }
    }
    reader.onerror = reject
    reader.readAsArrayBuffer(file)
  })
}

/**
 * JSON 배열 → Excel 파일 다운로드
 *
 * @param {Array<Object>} data — 각 객체의 키가 헤더 행이 됨
 * @param {string} filename    — 확장자(.xlsx) 포함 또는 미포함 모두 허용
 *
 * 예시:
 *   downloadExcel([{ SKU: 'SKU-001', 수량: 100 }], '주문목록')
 *   → '주문목록.xlsx' 파일 다운로드
 *
 *   downloadExcel(rows, '재고현황.xlsx')
 *   → '재고현황.xlsx' 파일 다운로드 (확장자 중복 없음)
 */
export async function downloadExcel(data, filename = 'download') {
  const XLSX = await loadXlsx()
  // 확장자 중복 방지: 이미 .xlsx로 끝나면 그대로 사용
  const name = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`
  const ws = XLSX.utils.json_to_sheet(data)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1')
  XLSX.writeFile(wb, name)
}
