/** Mấy mối ngoài chợ: tên, câu chào, ngày nghỉ. Giá nằm ở `econ`. */
export type SupplierId = "LO_BA_TAM" | "CO_NHUNG" | "CHU_CHIN" | "DI_NAM" | "CO_MAI";

type SupplierDef = { name: string; greet: string; closedDays?: number[] };

export const SUPPLIERS: Record<SupplierId, SupplierDef> = {
  LO_BA_TAM: { name: "Lò bà Tám", greet: "Lấy gì con?", closedDays: [28, 29, 30] },
  CO_NHUNG: { name: "Sạp cô Nhung", greet: "Pate hả con?" },
  CHU_CHIN: { name: "Sạp chú Chín", greet: "Lấy gì?" },
  DI_NAM: { name: "Sạp dì Năm", greet: "Rau hả con?" },
  CO_MAI: { name: "Tạp hoá cô Mai", greet: "Lấy gì con?" },
};

export const isClosed = (id: SupplierId, day: number) => !!SUPPLIERS[id].closedDays?.includes(day);
