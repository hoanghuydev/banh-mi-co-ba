/**
 * stimId — MỘT NGUỒN DUY NHẤT (CANON §8.1 luật L4, P1-03 §2.7).
 *
 * Lúc làm bánh, lỗi trong ổ phát kích thích với khoá này; lúc giao bánh, delivery-diff
 * tra lại ĐÚNG khoá này để biết khách có chứng kiến lỗi ĐÓ không. Hai bên tự ghép
 * chuỗi riêng là sớm muộn lệch nhau một ký tự — và ANTICIPATED biến mất âm thầm,
 * không crash, không ai biết. Nên mọi chỗ ghép khoá đều gọi hàm ở đây.
 */
export function orderDefectKey(visitId: string, kind: string, item: string | null) {
  return `ORDER_DEFECT:${visitId}:${kind}:${item ?? "_"}`;
}
