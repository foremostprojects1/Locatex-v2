/** Number formatting of the original sliders (wNumb with a prefix/postfix). */
export function formatNumber(
  value,
  { decimals = 0, thousand = ",", prefix = "", postfix = "" } = {},
) {
  const [whole, fraction] = Number(value).toFixed(decimals).split(".");
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, thousand);
  return `${prefix}${grouped}${fraction ? `.${fraction}` : ""}${postfix}`;
}
