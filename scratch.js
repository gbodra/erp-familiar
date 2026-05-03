function parseAmount(amountStr) {
  const isNegative = amountStr.includes('-');
  const cleanStr = amountStr.replace(/\./g, '').replace(',', '.').replace('-', '').trim();
  const amount = parseFloat(cleanStr);
  return isNegative ? -amount : amount;
}

console.log(parseAmount(" 123,45"));
console.log(parseAmount(" 18.000,00-"));
console.log(parseAmount("-18.000,00"));
console.log(parseAmount(" 1.234,56 -"));
console.log(parseAmount("- 1.234,56"));
console.log(parseAmount(" 12,34"));
