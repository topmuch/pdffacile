const { PDFDocument, StandardFonts, rgb } = require("pdf-lib");
const fs = require("fs");

async function makePdf(name, numPages, text) {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  for (let i = 1; i <= numPages; i++) {
    const page = doc.addPage([595.28, 841.89]);
    page.drawRectangle({ x: 0, y: 0, width: 595.28, height: 120, color: rgb(0.9 + (i % 2) * 0.05, 0.2, 0.2) });
    page.drawText(`${text}`, { x: 60, y: 700, size: 28, font: fontBold, color: rgb(0.15, 0.15, 0.15) });
    page.drawText(`Page ${i} sur ${numPages}`, { x: 60, y: 650, size: 18, font, color: rgb(0.4, 0.4, 0.4) });
    page.drawText(
      "Ceci est un document de test genere pour valider le fonctionnement de PDFFacile. Il contient plusieurs lignes de texte afin de rendre chaque page visuellement identifiable pendant les tests de fusion, division, compression et numerotation.",
      { x: 60, y: 580, size: 12, font, color: rgb(0.3, 0.3, 0.3), maxWidth: 475, lineHeight: 20 }
    );
  }
  fs.writeFileSync(`/home/z/my-project/test-assets/${name}`, await doc.save());
  console.log(`OK ${name} (${numPages} pages)`);
}

(async () => {
  fs.mkdirSync("/home/z/my-project/test-assets", { recursive: true });
  await makePdf("doc-a.pdf", 5, "Document A");
  await makePdf("doc-b.pdf", 3, "Document B");
  await makePdf("doc-livraison.pdf", 10, "Rapport de livraison");
  console.log("PDF de test crees.");
})();
