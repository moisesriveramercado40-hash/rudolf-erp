// Utilidades para manejo de moneda en Soles (PEN)

/**
 * Formatea un número como moneda en soles peruanos
 * Usa punto como separador de decimales
 * Ejemplo: 1234.50 -> "1,234.50"
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-PE', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Formatea un número como moneda en soles peruanos con símbolo
 * Ejemplo: 1234.50 -> "S/ 1,234.50"
 */
export function formatCurrencyWithSymbol(amount: number): string {
  return `S/ ${formatCurrency(amount)}`;
}

/**
 * Parsea un string de moneda a número
 * Maneja tanto punto como coma como separador decimal
 */
export function parseCurrency(value: string): number {
  // Reemplazar coma por punto para el parseo
  const normalized = value.replace(/,/g, '').replace(/\./g, '.');
  return parseFloat(normalized) || 0;
}

/**
 * Valida si un string es un número válido para moneda
 */
export function isValidCurrency(value: string): boolean {
  const normalized = value.replace(/,/g, '');
  return !isNaN(parseFloat(normalized)) && parseFloat(normalized) >= 0;
}

/**
 * Input handler para campos de moneda
 * Permite solo números y un punto decimal
 */
export function handleCurrencyInput(value: string): string {
  // Permitir solo números y un punto decimal
  let cleaned = value.replace(/[^\d.]/g, '');
  
  // Asegurar solo un punto decimal
  const parts = cleaned.split('.');
  if (parts.length > 2) {
    cleaned = parts[0] + '.' + parts.slice(1).join('');
  }
  
  return cleaned;
}

/**
 * Formatea un número para mostrar en input
 * Mantiene el valor sin formato para edición
 */
export function formatInputCurrency(amount: number): string {
  return amount.toFixed(2);
}
