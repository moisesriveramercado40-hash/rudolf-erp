/**
 * Servicio de WhatsApp para RUDOLF ERP
 * 
 * Usa la API de wa.me para abrir WhatsApp Web/App con mensaje pre-llenado.
 * Compatible con WhatsApp Web en desktop y la app de WhatsApp en móvil.
 * 
 * Para una integración completa con API de WhatsApp Business (envío automático
 * sin abrir el navegador), se necesitaría un backend con la API de Meta.
 */

// ============ CONFIGURACIÓN ============
const COMPANY_NAME = 'Taller RUDOLF';
const COMPANY_PHONE = '084000000'; // Número del taller para respuestas

// ============ FORMATEO DE TELÉFONO ============

/**
 * Limpia y formatea un número de teléfono para WhatsApp.
 * WhatsApp necesita el formato: código de país + número sin espacios ni guiones.
 * Perú = 51
 */
export function formatPhoneForWhatsApp(phone: string): string {
  // Eliminar todo lo que no sea dígito
  let cleaned = phone.replace(/\D/g, '');
  
  // Si empieza con 0, quitarlo (prefijo local)
  if (cleaned.startsWith('0')) {
    cleaned = cleaned.substring(1);
  }
  
  // Si ya tiene código de país (51 para Perú), dejarlo
  if (cleaned.startsWith('51') && cleaned.length >= 11) {
    return cleaned;
  }
  
  // Si tiene 9 dígitos (móvil peruano), agregar 51
  if (cleaned.length === 9 && cleaned.startsWith('9')) {
    return `51${cleaned}`;
  }
  
  // Si tiene 7-8 dígitos (fijo peruano), agregar 51 + código de área
  if (cleaned.length >= 7 && cleaned.length <= 8) {
    return `5184${cleaned}`; // 84 = Cusco
  }
  
  // Fallback: agregar 51 si no tiene código de país
  if (cleaned.length > 9) {
    return cleaned;
  }
  
  return `51${cleaned}`;
}

/**
 * Genera la URL de WhatsApp con mensaje pre-llenado
 */
export function generateWhatsAppURL(phone: string, message: string): string {
  const formattedPhone = formatPhoneForWhatsApp(phone);
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${formattedPhone}?text=${encodedMessage}`;
}

/**
 * Abre WhatsApp en una nueva pestaña/ventana
 */
export function openWhatsApp(phone: string, message: string): void {
  const url = generateWhatsAppURL(phone, message);
  window.open(url, '_blank', 'noopener,noreferrer');
}

// ============ PLANTILLAS DE MENSAJES ============

export interface MessageTemplateData {
  clientName: string;
  motoInfo: string;
  orderNumber: string;
  totalCost?: number;
  laborCost?: number;
  partsCost?: number;
  estimatedTime?: string;
  additionalInfo?: string;
  date?: string;
}

function formatCurrency(amount: number): string {
  return `S/${amount.toFixed(2)}`;
}

/**
 * Genera mensajes profesionales con formato WhatsApp (negritas, etc.)
 */
export const messageTemplates = {
  
  trabajo_iniciado: (data: MessageTemplateData): string =>
    `🔧 *${COMPANY_NAME}*\n\n` +
    `Hola *${data.clientName}* 👋\n\n` +
    `Le informamos que hemos *iniciado el trabajo* en su moto:\n` +
    `🏍️ *${data.motoInfo}*\n` +
    `📋 Orden: *${data.orderNumber}*\n` +
    (data.estimatedTime ? `⏱️ Tiempo estimado: ${data.estimatedTime}\n` : '') +
    `\nLe avisaremos cuando esté lista.\n` +
    `\n¡Gracias por confiar en nosotros! 🙌`,

  trabajo_completado: (data: MessageTemplateData): string =>
    `✅ *${COMPANY_NAME}*\n\n` +
    `Hola *${data.clientName}* 👋\n\n` +
    `¡Buenas noticias! Su moto ya está *lista*:\n` +
    `🏍️ *${data.motoInfo}*\n` +
    `📋 Orden: *${data.orderNumber}*\n\n` +
    `💰 *Detalle de costos:*\n` +
    (data.laborCost ? `   • Mano de obra: ${formatCurrency(data.laborCost)}\n` : '') +
    (data.partsCost ? `   • Repuestos: ${formatCurrency(data.partsCost)}\n` : '') +
    (data.totalCost ? `   • *TOTAL: ${formatCurrency(data.totalCost)}*\n` : '') +
    `\n🕐 *Horario de atención:*\n` +
    `   Lun-Sáb: 8:00 AM - 6:00 PM\n` +
    `\nPuede pasar a recoger su moto cuando guste.\n` +
    `¡Gracias por su preferencia! 🙌`,

  listo_para_entrega: (data: MessageTemplateData): string =>
    `📦 *${COMPANY_NAME}*\n\n` +
    `Hola *${data.clientName}*\n\n` +
    `Su moto *${data.motoInfo}* está lista para *entrega*.\n` +
    `📋 Orden: *${data.orderNumber}*\n` +
    (data.totalCost ? `💰 Total: *${formatCurrency(data.totalCost)}*\n` : '') +
    `\n🕐 Horario: Lun-Sáb 8AM-6PM\n` +
    `\n¿A qué hora pasará a recogerla? 🙂`,

  faltan_repuestos: (data: MessageTemplateData): string =>
    `⚠️ *${COMPANY_NAME}*\n\n` +
    `Hola *${data.clientName}*\n\n` +
    `Para continuar con el trabajo de su moto *${data.motoInfo}*, necesitamos un repuesto:\n\n` +
    `📋 Orden: *${data.orderNumber}*\n` +
    (data.additionalInfo ? `🔩 Repuesto: *${data.additionalInfo}*\n` : '') +
    (data.totalCost ? `💰 Costo aproximado: *${formatCurrency(data.totalCost)}*\n` : '') +
    `\n¿Desea que lo ordenemos?\n` +
    `Responda *SÍ* para proceder o *NO* si prefiere traerlo usted.\n` +
    `\nQuedamos atentos 🙏`,

  falla_adicional: (data: MessageTemplateData): string =>
    `🔍 *${COMPANY_NAME}*\n\n` +
    `Hola *${data.clientName}*\n\n` +
    `Al revisar su moto *${data.motoInfo}* encontramos una *falla adicional*:\n\n` +
    `📋 Orden: *${data.orderNumber}*\n` +
    (data.additionalInfo ? `⚙️ Detalle: *${data.additionalInfo}*\n` : '') +
    (data.totalCost ? `💰 Costo adicional estimado: *${formatCurrency(data.totalCost)}*\n` : '') +
    `\n¿Desea que procedamos con la reparación adicional?\n` +
    `Responda *SÍ* o *NO*.\n` +
    `\nQuedamos a su disposición 🙏`,

  recordatorio: (data: MessageTemplateData): string =>
    `🔔 *${COMPANY_NAME}*\n\n` +
    `Hola *${data.clientName}*\n\n` +
    `Le recordamos que su moto *${data.motoInfo}* está lista para recoger desde el *${data.date || 'hace unos días'}*.\n\n` +
    `📋 Orden: *${data.orderNumber}*\n` +
    (data.totalCost ? `💰 Total: *${formatCurrency(data.totalCost)}*\n` : '') +
    `\n🕐 Horario: Lun-Sáb 8AM-6PM\n` +
    `\nQuedamos atentos a su visita 🙂`,

  cotizacion_lista: (data: MessageTemplateData): string =>
    `📄 *${COMPANY_NAME}*\n\n` +
    `Hola *${data.clientName}*\n\n` +
    `Su cotización está lista:\n` +
    `🏍️ *${data.motoInfo}*\n` +
    `📋 ${data.orderNumber}\n` +
    (data.totalCost ? `💰 Total estimado: *${formatCurrency(data.totalCost)}*\n` : '') +
    (data.additionalInfo ? `\n${data.additionalInfo}\n` : '') +
    `\n¿Desea que procedamos con el trabajo?\n` +
    `Responda *SÍ* para confirmar.\n` +
    `\n¡Gracias! 🙌`,

  mensaje_libre: (data: MessageTemplateData & { customMessage: string }): string =>
    `*${COMPANY_NAME}*\n\n` +
    `Hola *${data.clientName}*\n\n` +
    `${data.customMessage}\n` +
    `\n📋 Ref: ${data.orderNumber}\n` +
    `🏍️ ${data.motoInfo}`,
};

export type MessageTemplateType = keyof typeof messageTemplates;

/**
 * Genera un mensaje completo usando una plantilla
 */
export function generateMessage(
  templateType: MessageTemplateType,
  data: MessageTemplateData & { customMessage?: string }
): string {
  const template = messageTemplates[templateType];
  if (!template) return '';
  return (template as (d: typeof data) => string)(data);
}

/**
 * Envía un mensaje de WhatsApp: abre wa.me y registra la notificación
 */
export function sendWhatsAppMessage(
  phone: string,
  templateType: MessageTemplateType,
  data: MessageTemplateData & { customMessage?: string }
): { success: boolean; message: string; url: string } {
  const message = generateMessage(templateType, data);
  const url = generateWhatsAppURL(phone, message);
  
  try {
    window.open(url, '_blank', 'noopener,noreferrer');
    return { success: true, message, url };
  } catch {
    return { success: false, message, url };
  }
}
