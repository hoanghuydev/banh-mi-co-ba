/** Bỏ click mồ côi: cú chạm đã mở lớp phủ nhả ra thì trình duyệt bắn click vào nút dưới ngón. */
export function guardStrayClick(root: HTMLElement) {
  let armed = false;
  root.addEventListener("pointerdown", () => { armed = true; }, true);
  root.addEventListener("click", (e) => {
    if (armed) { armed = false; return; }
    e.stopPropagation();
    e.preventDefault();
  }, true);
}
