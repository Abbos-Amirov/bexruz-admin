export interface ReceiptProduct {
  productName: string;
  quantity: number;
  price: number;
}

export interface ReceiptOrder {
  orderId: string;
  createdAt?: string;
  products: ReceiptProduct[];
}

interface PrintReceiptInput {
  tableNumber: string | number;
  orders: ReceiptOrder[];
  /** i18next t() — faqat bitta kalit bilan chaqiriladi */
  t: (key: string) => string;
}

const RESTAURANT_NAME = "BEXRUZ";

const escapeHtml = (value: unknown): string =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const money = (value: number): string =>
  `₩${(Number(value) || 0).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;

const formatDate = (value?: string | Date): string => {
  const d = value ? new Date(value) : new Date();
  if (isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

/** 80mm termoprinter uchun chek HTML */
function buildReceiptHtml({ tableNumber, orders, t }: PrintReceiptInput): string {
  const total = orders.reduce(
    (sum, order) =>
      sum + order.products.reduce((s, p) => s + (Number(p.quantity) || 0) * (Number(p.price) || 0), 0),
    0
  );

  const orderBlocks = orders
    .map((order) => {
      const rows = order.products
        .map(
          (p) => `
          <div class="item">
            <div class="name">${escapeHtml(p.productName)}</div>
            <div class="line">
              <span>${escapeHtml(p.quantity)} x ${money(p.price)}</span>
              <span class="sum">${money((Number(p.quantity) || 0) * (Number(p.price) || 0))}</span>
            </div>
          </div>`
        )
        .join("");
      const orderLabel = `${escapeHtml(t("receipt.order"))} #${escapeHtml(order.orderId.slice(-6).toUpperCase())}`;
      const time = order.createdAt ? formatDate(order.createdAt) : "";
      return `
        <div class="order">
          <div class="order-head"><span>${orderLabel}</span><span>${escapeHtml(time)}</span></div>
          ${rows}
        </div>`;
    })
    .join('<div class="dash"></div>');

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>${escapeHtml(t("receipt.title"))} — ${escapeHtml(t("receipt.table"))} ${escapeHtml(tableNumber)}</title>
<style>
  @page { size: 80mm auto; margin: 4mm; }
  * { box-sizing: border-box; }
  body {
    width: 72mm;
    margin: 0 auto;
    font-family: "Courier New", ui-monospace, monospace;
    font-size: 12px;
    line-height: 1.35;
    color: #000;
    background: #fff;
  }
  .brand { text-align: center; font-size: 22px; font-weight: 800; letter-spacing: 4px; margin-top: 4px; }
  .sub { text-align: center; font-size: 11px; margin-bottom: 6px; }
  .meta { display: flex; justify-content: space-between; font-size: 12px; }
  .meta strong { font-size: 15px; }
  .dash { border-top: 1px dashed #000; margin: 6px 0; }
  .order-head { display: flex; justify-content: space-between; font-size: 11px; font-weight: 700; margin-bottom: 2px; }
  .item { padding: 2px 0; }
  .item .name { font-weight: 700; word-break: break-word; }
  .item .line { display: flex; justify-content: space-between; gap: 8px; }
  .item .sum { font-weight: 700; white-space: nowrap; }
  .total { display: flex; justify-content: space-between; font-size: 17px; font-weight: 800; margin-top: 2px; }
  .thanks { text-align: center; margin-top: 10px; font-size: 12px; }
</style>
</head>
<body>
  <div class="brand">${RESTAURANT_NAME}</div>
  <div class="sub">${escapeHtml(t("receipt.title"))}</div>
  <div class="dash"></div>
  <div class="meta"><strong>${escapeHtml(t("receipt.table"))} ${escapeHtml(tableNumber)}</strong><span>${escapeHtml(formatDate())}</span></div>
  <div class="dash"></div>
  ${orderBlocks}
  <div class="dash"></div>
  <div class="total"><span>${escapeHtml(t("receipt.total"))}</span><span>${money(total)}</span></div>
  <div class="dash"></div>
  <div class="thanks">${escapeHtml(t("receipt.thanks"))}</div>
</body>
</html>`;
}

/**
 * Chekni yashirin iframe orqali chop etadi (popup blokerga tushmaydi).
 * Bitta buyurtma uchun ham, stolning barcha buyurtmalari uchun ham ishlatiladi.
 */
export function printReceipt(input: PrintReceiptInput): void {
  const orders = input.orders.filter((o) => o.products.length > 0);
  if (orders.length === 0) return;

  const iframe = document.createElement("iframe");
  iframe.setAttribute("aria-hidden", "true");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!doc || !iframe.contentWindow) {
    iframe.remove();
    return;
  }
  doc.open();
  doc.write(buildReceiptHtml({ ...input, orders }));
  doc.close();

  const win = iframe.contentWindow;
  const cleanup = () => setTimeout(() => iframe.remove(), 500);
  win.addEventListener("afterprint", cleanup);
  // Shrift va layout tayyor bo'lishi uchun bir oz kutamiz
  setTimeout(() => {
    win.focus();
    win.print();
    // afterprint ishlamaydigan brauzerlar uchun zaxira tozalash
    setTimeout(() => iframe.parentNode && iframe.remove(), 60000);
  }, 250);
}
