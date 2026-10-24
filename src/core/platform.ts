/** Mọi truy cập lưu trữ/file đi qua đây; lỗi (hết quota, chế độ riêng tư) đều nuốt để không sập game. */
export type Platform = {
  kind: "web" | "electron" | "memory";
  read(key: string): string | null;
  write(key: string, value: string): boolean;
  remove(key: string): void;
  keys(prefix: string): string[];
  download(filename: string, text: string, mime?: string): void;
};

function webPlatform(): Platform {
  const ls = (): Storage | null => {
    try { return globalThis.localStorage ?? null; } catch { return null; }
  };
  return {
    kind: "web",
    read: (k) => { try { return ls()?.getItem(k) ?? null; } catch { return null; } },
    write: (k, v) => { try { ls()?.setItem(k, v); return !!ls(); } catch { return false; } },
    remove: (k) => { try { ls()?.removeItem(k); } catch { /* bỏ qua */ } },
    keys: (prefix) => {
      const s = ls(); if (!s) return [];
      const out: string[] = [];
      try { for (let i = 0; i < s.length; i++) { const k = s.key(i); if (k?.startsWith(prefix)) out.push(k); } }
      catch { /* bỏ qua */ }
      return out;
    },
    download: (filename, text, mime = "application/x-ndjson") => {
      const url = URL.createObjectURL(new Blob([text], { type: mime }));
      const a = document.createElement("a");
      a.href = url; a.download = filename;
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
    },
  };
}

/** Lưu trong RAM cho test và headless sim. */
export function memoryPlatform(): Platform {
  const m = new Map<string, string>();
  return {
    kind: "memory",
    read: (k) => m.get(k) ?? null,
    write: (k, v) => { m.set(k, v); return true; },
    remove: (k) => { m.delete(k); },
    keys: (p) => [...m.keys()].filter((k) => k.startsWith(p)),
    download: () => { /* không có người để đưa file */ },
  };
}

export const platform: Platform = typeof document !== "undefined" ? webPlatform() : memoryPlatform();

const failListeners = new Set<() => void>();

/** Lần ghi save gần nhất có thất bại không (hết chỗ, chế độ riêng tư). */
export const saveHealth = { writeFailed: false };

export function reportSaveWrite(ok: boolean) {
  const was = saveHealth.writeFailed;
  saveHealth.writeFailed = !ok;
  if (!ok && !was) for (const cb of [...failListeners]) cb();
}

/** Chỉ gọi khi chuyển từ ghi được sang ghi lỗi, không lặp mỗi lần thử lại. */
export function onSaveFailed(cb: () => void): () => void {
  failListeners.add(cb);
  return () => { failListeners.delete(cb); };
}
