export type Contact = { id: string; name: string; initial: string; tint: string; group?: boolean };

export const ME = "me";

export const CONTACTS: Record<string, Contact> = {
  sep: { id: "sep", name: "Sếp Tùng", initial: "T", tint: "#5b6b7a" },
  team: { id: "team", name: "Team MKT", initial: "M", tint: "#c9772b", group: true },
  mom: { id: "mom", name: "Mẹ", initial: "M", tint: "#c0507a" },
  landlord: { id: "landlord", name: "Chú Tâm (chủ nhà)", initial: "T", tint: "#7a6a3f" },
  linh: { id: "linh", name: "Thuỳ Linh", initial: "L", tint: "#2f8f83" },
  huy: { id: "huy", name: "Hoàng Huy", initial: "H", tint: "#4f6fb3" },
  thai: { id: "thai", name: "Văn Thái", initial: "T", tint: "#8a5fb3" },
};

/** Thành viên nhóm chat, theo thứ tự hiện trong trang thành viên. */
export const MEMBERS: Record<string, string[]> = { team: ["linh", "huy", "thai"] };

export const contactOf = (id: string): Contact =>
  CONTACTS[id] ?? { id, name: id, initial: id.slice(0, 1).toUpperCase(), tint: "#6a7680" };
