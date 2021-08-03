import SignPDF from "./SignPDF";
import fs from "fs";

async function main() {
  const pdfBuffer = new SignPDF(
    'absolute_path_of_pdf_you_want_to_sign_goes_here',
    'absolute_path_of_p12_certificate_goes_here'
  );

  const signedDocs = await pdfBuffer.signPDF();
  const randomFourDigitNumber = Math.floor(Math.random() * 5000);
  const pdfName = `./exports/any_name_you_want_${randomFourDigitNumber}.pdf`;

  fs.writeFileSync(pdfName, signedDocs);
  console.log(`New Signed PDF created called: ${pdfName}`);
}

main();
