import { onSaveFailed } from "../core/platform";

const CSS = `
#save-toast{position:fixed;left:50%;top:calc(var(--safe-top) + .75rem);transform:translateX(-50%);z-index:40;max-width:calc(100vw - 2rem);
  padding:.6rem 1.1rem;border-radius:999px;background:#b52a1a;color:#fff;font:700 .95rem/1.3 "Be Vietnam Pro",system-ui,sans-serif;
  box-shadow:0 4px 12px rgba(0,0,0,.45);pointer-events:none;opacity:0;transition:opacity .25s ease}
#save-toast.on{opacity:1}
`;

export function installSaveToast() {
  const style = document.createElement("style");
  style.textContent = CSS;
  document.head.appendChild(style);
  const el = document.createElement("div");
  el.id = "save-toast";
  el.setAttribute("role", "status");
  el.textContent = "Không lưu được ván chơi";
  document.body.appendChild(el);
  let timer = 0;
  onSaveFailed(() => {
    el.classList.add("on");
    clearTimeout(timer);
    timer = window.setTimeout(() => el.classList.remove("on"), 6000);
  });
}
