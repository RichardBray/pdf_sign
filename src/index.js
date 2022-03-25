import SignPDF from "./SignPDF.js";
import fs from "node:fs";
import path from "node:path";

async function main() {
  const pdfBuffer = new SignPDF(
    path.resolve('assets/minions.pdf'),
    path.resolve('assets/certificate.p12')
  );

  const signedDocs = await pdfBuffer.signPDF();
  const randomNumber = Math.floor(Math.random() * 5000);
  const pdfFileName = `./exports/exported_file_${randomNumber}.pdf`;

  fs.writeFileSync(pdfFileName, signedDocs);
  console.log(`New Signed PDF created called: ${pdfFileName}`);
}

main();
