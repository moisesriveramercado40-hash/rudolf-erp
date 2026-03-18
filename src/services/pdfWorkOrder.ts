import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { WorkOrder, Client, Motorcycle, WorkOrderTask, MotorcycleInspection } from '@/types';

// ============ CONFIGURACIÓN ============
const COMPANY = {
  name: 'RUDOLF',
  subtitle: 'Taller de Motos',
  tagline: 'Servicio profesional y garantizado',
  address: 'Cusco, Perú',
  phone: '(084) 000-000',
  email: 'contacto@rudolf.pe',
};

const COLORS = {
  primary: [234, 88, 12] as [number, number, number],     // Orange-600
  primaryDark: [194, 65, 12] as [number, number, number],  // Orange-700
  dark: [30, 41, 59] as [number, number, number],          // Slate-800
  medium: [100, 116, 139] as [number, number, number],     // Slate-500
  light: [226, 232, 240] as [number, number, number],      // Slate-200
  white: [255, 255, 255] as [number, number, number],
  bgLight: [248, 250, 252] as [number, number, number],    // Slate-50
  blue: [37, 99, 235] as [number, number, number],
  green: [22, 163, 74] as [number, number, number],
  red: [220, 38, 38] as [number, number, number],
};

const STATUS_LABELS: Record<string, string> = {
  pendiente: 'Pendiente',
  asignado: 'Asignado',
  en_progreso: 'En Progreso',
  espera_repuestos: 'Espera Repuestos',
  calidad: 'Control Calidad',
  completado: 'Completado',
  entregado: 'Entregado',
  cancelado: 'Cancelado',
};

const WORK_TYPE_LABELS: Record<string, string> = {
  mantenimiento: 'Mantenimiento',
  reparacion: 'Reparación',
  diagnostico: 'Diagnóstico',
  modificacion: 'Modificación',
  garantia_bajaj: 'Garantía Bajaj',
  garantia_particular: 'Garantía Particulares',
};

const PRIORITY_LABELS: Record<string, string> = {
  baja: 'Baja',
  media: 'Media',
  alta: 'Alta',
  urgente: 'Urgente',
};

// ============ HELPERS ============
function formatDate(date: Date | string | undefined): string {
  if (!date) return '—';
  const d = date instanceof Date ? date : new Date(date);
  return d.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatDateTime(date: Date | string | undefined): string {
  if (!date) return '—';
  const d = date instanceof Date ? date : new Date(date);
  return d.toLocaleDateString('es-PE', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function formatCurrency(amount: number): string {
  return `S/ ${amount.toFixed(2)}`;
}

// ============ PDF GENERATOR ============
interface GeneratePDFParams {
  order: WorkOrder;
  client: Client | undefined;
  motorcycle: Motorcycle | undefined;
  tasks: WorkOrderTask[];
  inspection?: MotorcycleInspection;
  mechanicNames?: string[];
}

export function generateWorkOrderPDF({
  order,
  client,
  motorcycle,
  tasks,
  inspection,
  mechanicNames = [],
}: GeneratePDFParams): void {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  // ============ HEADER ============
  // Orange bar top
  doc.setFillColor(...COLORS.primary);
  doc.rect(0, 0, pageWidth, 4, 'F');

  y = 14;

  // Company name
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(24);
  doc.setTextColor(...COLORS.primary);
  doc.text(COMPANY.name, margin, y);

  // Subtitle
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...COLORS.medium);
  doc.text(COMPANY.subtitle, margin, y + 6);
  doc.text(COMPANY.tagline, margin, y + 11);

  // Order number box (right side)
  const boxW = 70;
  const boxX = pageWidth - margin - boxW;
  doc.setFillColor(...COLORS.bgLight);
  doc.setDrawColor(...COLORS.light);
  doc.roundedRect(boxX, y - 8, boxW, 24, 3, 3, 'FD');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.medium);
  doc.text('ORDEN DE TRABAJO', boxX + boxW / 2, y - 2, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(...COLORS.dark);
  doc.text(order.orderNumber || '—', boxX + boxW / 2, y + 8, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...COLORS.medium);
  doc.text(`Fecha: ${formatDate(order.createdAt)}`, boxX + boxW / 2, y + 14, { align: 'center' });

  y += 22;

  // Separator
  doc.setDrawColor(...COLORS.light);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  y += 6;

  // ============ INFO GRID (2 columns) ============

  // Column 1: Client info
  const col1X = margin;
  const col2X = margin + contentWidth / 2 + 5;
  const colW = contentWidth / 2 - 5;

  // Client card
  doc.setFillColor(...COLORS.bgLight);
  doc.roundedRect(col1X, y, colW, 34, 2, 2, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.primary);
  doc.text('CLIENTE', col1X + 4, y + 5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...COLORS.dark);
  doc.text(
    client ? `${client.firstName} ${client.lastName}` : 'Cliente no encontrado',
    col1X + 4, y + 12
  );

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.medium);
  if (client?.phone) doc.text(`Tel: ${client.phone}`, col1X + 4, y + 18);
  if (client?.email) doc.text(`Email: ${client.email}`, col1X + 4, y + 23);
  if (client?.address) doc.text(`Dir: ${client.address}`, col1X + 4, y + 28);
  if (client?.dni) doc.text(`DNI: ${client.dni}`, col1X + 4, y + (client?.address ? 33 : 28));

  // Motorcycle card
  doc.setFillColor(...COLORS.bgLight);
  doc.roundedRect(col2X, y, colW, 34, 2, 2, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.primary);
  doc.text('MOTOCICLETA', col2X + 4, y + 5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...COLORS.dark);
  doc.text(
    motorcycle ? `${motorcycle.brand} ${motorcycle.model}` : 'Moto no encontrada',
    col2X + 4, y + 12
  );

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.medium);
  if (motorcycle?.plate) doc.text(`Placa: ${motorcycle.plate}`, col2X + 4, y + 18);
  if (motorcycle?.year) doc.text(`Año: ${motorcycle.year}`, col2X + 4, y + 23);
  if (motorcycle?.mileage !== undefined) {
    doc.text(`Kilometraje: ${motorcycle.mileage.toLocaleString()} km`, col2X + 4, y + 28);
  }
  if (motorcycle?.vin) doc.text(`VIN: ${motorcycle.vin}`, col2X + 4, y + 33);

  y += 40;

  // ============ ORDER DETAILS ROW ============
  const detailItems = [
    { label: 'Tipo de Trabajo', value: WORK_TYPE_LABELS[order.workType] || order.workType },
    { label: 'Prioridad', value: PRIORITY_LABELS[order.priority] || order.priority },
    { label: 'Estado', value: STATUS_LABELS[order.status] || order.status },
    { label: 'Mecánico(s)', value: mechanicNames.length > 0 ? mechanicNames.join(', ') : 'Sin asignar' },
  ];

  const detailColW = contentWidth / detailItems.length;
  doc.setFillColor(...COLORS.primary);
  doc.roundedRect(margin, y, contentWidth, 16, 2, 2, 'F');

  detailItems.forEach((item, i) => {
    const x = margin + i * detailColW;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(255, 255, 255);
    doc.text(item.label.toUpperCase(), x + 4, y + 5);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text(item.value, x + 4, y + 12);
  });

  y += 22;

  // ============ DESCRIPTION ============
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.dark);
  doc.text('Descripción del Trabajo:', margin, y);
  y += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.medium);
  const descLines = doc.splitTextToSize(order.description || 'Sin descripción', contentWidth);
  doc.text(descLines, margin, y);
  y += descLines.length * 4 + 2;

  if (order.diagnosis) {
    y += 2;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.dark);
    doc.text('Diagnóstico:', margin, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.medium);
    const diagLines = doc.splitTextToSize(order.diagnosis, contentWidth);
    doc.text(diagLines, margin, y);
    y += diagLines.length * 4 + 2;
  }

  y += 4;

  // ============ ITEMS TABLE ============
  const laborTasks = tasks.filter(t => t.type === 'mano_obra');
  const partsTasks = tasks.filter(t => t.type === 'repuesto');
  const otherTasks = tasks.filter(t => t.type !== 'mano_obra' && t.type !== 'repuesto');

  // Labor table
  if (laborTasks.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.blue);
    doc.text('Mano de Obra', margin, y);
    y += 2;

    autoTable(doc, {
      startY: y,
      head: [['#', 'Descripción', 'Cant.', 'P. Unit.', 'Total']],
      body: laborTasks.map((t, i) => [
        String(i + 1),
        t.description,
        String(t.quantity),
        formatCurrency(t.unitPrice),
        formatCurrency(t.totalPrice),
      ]),
      foot: [[
        '', '', '', 'Subtotal MO:',
        formatCurrency(laborTasks.reduce((s, t) => s + t.totalPrice, 0)),
      ]],
      margin: { left: margin, right: margin },
      styles: { fontSize: 8, cellPadding: 2.5, textColor: COLORS.dark },
      headStyles: {
        fillColor: COLORS.blue,
        textColor: COLORS.white,
        fontStyle: 'bold',
        fontSize: 7.5,
      },
      footStyles: {
        fillColor: COLORS.bgLight,
        textColor: COLORS.dark,
        fontStyle: 'bold',
        fontSize: 8,
      },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        2: { cellWidth: 15, halign: 'center' },
        3: { cellWidth: 25, halign: 'right' },
        4: { cellWidth: 25, halign: 'right' },
      },
      alternateRowStyles: { fillColor: [245, 247, 250] },
    });

    y = (doc as any).lastAutoTable.finalY + 6;
  }

  // Parts table
  if (partsTasks.length > 0) {
    // Check if we need a new page
    if (y > 230) {
      doc.addPage();
      y = margin;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.green);
    doc.text('Repuestos', margin, y);
    y += 2;

    autoTable(doc, {
      startY: y,
      head: [['#', 'Descripción', 'Cant.', 'P. Unit.', 'Total']],
      body: partsTasks.map((t, i) => [
        String(i + 1),
        t.description,
        String(t.quantity),
        formatCurrency(t.unitPrice),
        formatCurrency(t.totalPrice),
      ]),
      foot: [[
        '', '', '', 'Subtotal Rep:',
        formatCurrency(partsTasks.reduce((s, t) => s + t.totalPrice, 0)),
      ]],
      margin: { left: margin, right: margin },
      styles: { fontSize: 8, cellPadding: 2.5, textColor: COLORS.dark },
      headStyles: {
        fillColor: COLORS.green,
        textColor: COLORS.white,
        fontStyle: 'bold',
        fontSize: 7.5,
      },
      footStyles: {
        fillColor: COLORS.bgLight,
        textColor: COLORS.dark,
        fontStyle: 'bold',
        fontSize: 8,
      },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        2: { cellWidth: 15, halign: 'center' },
        3: { cellWidth: 25, halign: 'right' },
        4: { cellWidth: 25, halign: 'right' },
      },
      alternateRowStyles: { fillColor: [245, 250, 246] },
    });

    y = (doc as any).lastAutoTable.finalY + 6;
  }

  // Other tasks
  if (otherTasks.length > 0) {
    if (y > 230) {
      doc.addPage();
      y = margin;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.medium);
    doc.text('Otros Servicios', margin, y);
    y += 2;

    autoTable(doc, {
      startY: y,
      head: [['#', 'Descripción', 'Cant.', 'P. Unit.', 'Total']],
      body: otherTasks.map((t, i) => [
        String(i + 1),
        t.description,
        String(t.quantity),
        formatCurrency(t.unitPrice),
        formatCurrency(t.totalPrice),
      ]),
      margin: { left: margin, right: margin },
      styles: { fontSize: 8, cellPadding: 2.5, textColor: COLORS.dark },
      headStyles: {
        fillColor: COLORS.medium,
        textColor: COLORS.white,
        fontStyle: 'bold',
        fontSize: 7.5,
      },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        2: { cellWidth: 15, halign: 'center' },
        3: { cellWidth: 25, halign: 'right' },
        4: { cellWidth: 25, halign: 'right' },
      },
    });

    y = (doc as any).lastAutoTable.finalY + 6;
  }

  // If no tasks at all, show costs from order
  if (tasks.length === 0 && (order.laborCost > 0 || order.partsCost > 0)) {
    autoTable(doc, {
      startY: y,
      head: [['Concepto', 'Monto']],
      body: [
        ['Mano de Obra', formatCurrency(order.laborCost)],
        ['Repuestos', formatCurrency(order.partsCost)],
      ],
      margin: { left: margin, right: margin },
      styles: { fontSize: 9, cellPadding: 3, textColor: COLORS.dark },
      headStyles: { fillColor: COLORS.primary, textColor: COLORS.white, fontStyle: 'bold' },
      columnStyles: { 1: { halign: 'right', cellWidth: 40 } },
    });

    y = (doc as any).lastAutoTable.finalY + 6;
  }

  // ============ TOTAL BOX ============
  if (y > 245) {
    doc.addPage();
    y = margin;
  }

  const totalBoxW = 80;
  const totalBoxX = pageWidth - margin - totalBoxW;

  // Cost breakdown
  doc.setFillColor(...COLORS.bgLight);
  doc.roundedRect(totalBoxX, y, totalBoxW, 30, 2, 2, 'F');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.medium);
  doc.text('Mano de Obra:', totalBoxX + 4, y + 7);
  doc.text(formatCurrency(order.laborCost), totalBoxX + totalBoxW - 4, y + 7, { align: 'right' });

  doc.text('Repuestos:', totalBoxX + 4, y + 14);
  doc.text(formatCurrency(order.partsCost), totalBoxX + totalBoxW - 4, y + 14, { align: 'right' });

  // Total
  doc.setDrawColor(...COLORS.primary);
  doc.setLineWidth(0.5);
  doc.line(totalBoxX + 4, y + 18, totalBoxX + totalBoxW - 4, y + 18);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...COLORS.primary);
  doc.text('TOTAL:', totalBoxX + 4, y + 27);
  doc.text(formatCurrency(order.totalCost), totalBoxX + totalBoxW - 4, y + 27, { align: 'right' });

  y += 36;

  // ============ INSPECTION SUMMARY ============
  if (inspection) {
    if (y > 230) {
      doc.addPage();
      y = margin;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.dark);
    doc.text('Pre-inspección de la Motocicleta', margin, y);
    y += 5;

    const conditionMap: Record<string, string> = {
      excelente: 'Excelente', bueno: 'Bueno', regular: 'Regular', malo: 'Malo',
    };

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.medium);
    doc.text(`Condición general: ${conditionMap[inspection.generalCondition] || inspection.generalCondition}`, margin, y);
    doc.text(`Kilometraje: ${inspection.mileageAtInspection.toLocaleString()} km`, margin + 70, y);
    y += 5;

    if (inspection.damages && inspection.damages.length > 0) {
      doc.text(`Daños encontrados: ${inspection.damages.length}`, margin, y);
      y += 4;
      inspection.damages.forEach((d) => {
        doc.text(`  • ${d.type} - ${d.location}${d.description ? ': ' + d.description : ''}`, margin + 2, y);
        y += 4;
      });
    } else {
      doc.text('Sin daños registrados', margin, y);
      y += 4;
    }

    if (inspection.notes) {
      y += 2;
      doc.text(`Observaciones: ${inspection.notes}`, margin, y);
      y += 4;
    }

    y += 4;
  }

  // ============ DATES TIMELINE ============
  if (y > 245) {
    doc.addPage();
    y = margin;
  }

  doc.setDrawColor(...COLORS.light);
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageWidth - margin, y);
  y += 5;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.dark);
  doc.text('Registro de Tiempos', margin, y);
  y += 5;

  const timeEntries = [
    { label: 'Creada', date: order.createdAt },
    { label: 'Asignada', date: order.assignedAt },
    { label: 'Iniciada', date: order.startedAt },
    { label: 'Completada', date: order.completedAt },
    { label: 'Entregada', date: order.deliveredAt },
  ].filter(e => e.date);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...COLORS.medium);

  const timeColW = contentWidth / Math.max(timeEntries.length, 1);
  timeEntries.forEach((entry, i) => {
    const x = margin + i * timeColW;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.text(entry.label, x, y);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...COLORS.dark);
    doc.text(formatDateTime(entry.date), x, y + 4);
    doc.setTextColor(...COLORS.medium);
  });

  y += 14;

  // ============ SIGNATURE AREA ============
  if (y > 240) {
    doc.addPage();
    y = margin;
  }

  doc.setDrawColor(...COLORS.light);
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageWidth - margin, y);
  y += 10;

  // Two signature blocks
  const sigW = contentWidth / 2 - 10;

  // Client signature
  doc.setDrawColor(...COLORS.medium);
  doc.setLineWidth(0.3);
  doc.line(margin, y + 20, margin + sigW, y + 20);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.medium);
  doc.text('Firma del Cliente', margin + sigW / 2, y + 26, { align: 'center' });
  doc.setFontSize(7);
  doc.text(
    client ? `${client.firstName} ${client.lastName}` : '',
    margin + sigW / 2, y + 31, { align: 'center' }
  );

  // Technician signature
  const sig2X = margin + contentWidth / 2 + 10;
  doc.setLineWidth(0.3);
  doc.line(sig2X, y + 20, sig2X + sigW, y + 20);
  doc.setFontSize(8);
  doc.text('Firma del Técnico', sig2X + sigW / 2, y + 26, { align: 'center' });
  doc.setFontSize(7);
  doc.text(
    mechanicNames.length > 0 ? mechanicNames[0] : '',
    sig2X + sigW / 2, y + 31, { align: 'center' }
  );

  // ============ FOOTER ============
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    const pgHeight = doc.internal.pageSize.getHeight();

    // Footer line
    doc.setDrawColor(...COLORS.light);
    doc.setLineWidth(0.3);
    doc.line(margin, pgHeight - 14, pageWidth - margin, pgHeight - 14);

    // Footer text
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(...COLORS.medium);
    doc.text(
      `${COMPANY.name} ${COMPANY.subtitle} | ${COMPANY.address} | ${COMPANY.phone}`,
      margin, pgHeight - 9
    );
    doc.text(
      `Página ${i} de ${pageCount}`,
      pageWidth - margin, pgHeight - 9, { align: 'right' }
    );

    // Bottom orange bar
    doc.setFillColor(...COLORS.primary);
    doc.rect(0, pgHeight - 3, pageWidth, 3, 'F');
  }

  // ============ SAVE ============
  const fileName = `Orden_${order.orderNumber || 'sin-numero'}_${formatDate(order.createdAt).replace(/\//g, '-')}.pdf`;
  doc.save(fileName);
}
