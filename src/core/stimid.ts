/** Khoá stim lỗi dùng chung cho lúc làm bánh và delivery-diff — tự ghép riêng dễ lệch, ANTICIPATED mất âm thầm. */
export function orderDefectKey(visitId: string, kind: string, item: string | null) {
  return `ORDER_DEFECT:${visitId}:${kind}:${item ?? "_"}`;
}
