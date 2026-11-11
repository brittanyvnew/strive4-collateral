// Expose the export libraries globally so app.js can use them.
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import qrcode from 'qrcode-generator';

window.html2canvas = html2canvas;
window.jspdf = { jsPDF };
window.qrcode = qrcode;
