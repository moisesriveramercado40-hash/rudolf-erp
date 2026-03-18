declare module 'jspdf-autotable' {
  import { jsPDF } from 'jspdf';
  
  interface AutoTableOptions {
    startY?: number;
    head?: any[][];
    body?: any[][];
    foot?: any[][];
    margin?: { left?: number; right?: number; top?: number; bottom?: number };
    styles?: Record<string, any>;
    headStyles?: Record<string, any>;
    bodyStyles?: Record<string, any>;
    footStyles?: Record<string, any>;
    alternateRowStyles?: Record<string, any>;
    columnStyles?: Record<number, Record<string, any>>;
    theme?: string;
    [key: string]: any;
  }

  export default function autoTable(doc: jsPDF, options: AutoTableOptions): void;
}
