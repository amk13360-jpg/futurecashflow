import { PDFDocument, StandardFonts } from 'pdf-lib';

export async function generateCessionAgreementPDF({ supplier, buyer }: { supplier: any, buyer: any }) {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const page = pdfDoc.addPage([595.28, 841.89]); // A4 size

  const text = `Cession Agreement\n\nSupplier: ${supplier.name}\nSupplier Address: ${supplier.address}\n\nBuyer: ${buyer.name}\nBuyer Address: ${buyer.address}\n\nAgreement Date: ${new Date().toLocaleDateString()}\n\n[Agreement Terms Here]\n\nSignature: ______________________`;

  page.drawText(text, {
    x: 50,
    y: 750,
    size: 12,
    font,
    lineHeight: 18,
    maxWidth: 495.28,
  });

  return await pdfDoc.save();
}
