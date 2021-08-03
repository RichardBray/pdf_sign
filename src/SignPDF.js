import {
  PDFDocument,
  PDFName,
  PDFNumber,
  PDFHexString,
  PDFString,
} from "pdf-lib";
import signer from "node-signpdf";
import fs from "fs";

import PDFArrayCustom from "./PDFArrayCustom";

export default class SignPDF {
  constructor(pdfFile, certFile) {
    this.pdfDoc = fs.readFileSync(pdfFile);
    this.certificate = fs.readFileSync(certFile);
  }

  /**
   * @param {Uint8Array} unit8
   */
  static unit8ToBuffer(unit8) {
    let buf = Buffer.alloc(unit8.byteLength);
    const view = new Uint8Array(unit8);

    for (let i = 0; i < buf.length; ++i) {
      buf[i] = view[i];
    }
    return buf;
  }

  async _addPlaceholder() {
    const convertedPDF = await PDFDocument.load(this.pdfDoc);
    const ByteRange = PDFArrayCustom.withContext(convertedPDF.context);
    const DEFAULT_BYTE_RANGE_PLACEHOLDER = "**********";
    const SIGNATURE_LENGTH = 3322;
    const pages = convertedPDF.getPages();

    ByteRange.push(PDFNumber.of(0));
    ByteRange.push(PDFName.of(DEFAULT_BYTE_RANGE_PLACEHOLDER));
    ByteRange.push(PDFName.of(DEFAULT_BYTE_RANGE_PLACEHOLDER));
    ByteRange.push(PDFName.of(DEFAULT_BYTE_RANGE_PLACEHOLDER));

    const signatureDict = convertedPDF.context.obj({
      Type: "Sig",
      Filter: "Adobe.PPKLite",
      SubFilter: "adbe.pkcs7.detached",
      ByteRange,
      Contents: PDFHexString.of("A".repeat(SIGNATURE_LENGTH)),
      Reason: PDFString.of("We need your signature for reasons..."),
      M: PDFString.fromDate(new Date()),
    });

    const signatureDictRef = convertedPDF.context.register(signatureDict);

    const widgetDict = convertedPDF.context.obj({
      Type: "Annot",
      Subtype: "Widget",
      FT: "Sig",
      Rect: [0, 0, 0, 0], // Signature rect size
      V: signatureDictRef,
      T: PDFString.of("CYB Signature"),
      F: 4,
      P: pages[0].ref,
    });

    const widgetDictRef = convertedPDF.context.register(widgetDict);

    // Add signature widget to the first page
    pages[0].node.set(
      PDFName.of("Annots"),
      convertedPDF.context.obj([widgetDictRef])
    );

    convertedPDF.catalog.set(
      PDFName.of("AcroForm"),
      convertedPDF.context.obj({
        SigFlags: 3,
        Fields: [widgetDictRef],
      })
    );

    // Allows signatures on newer PDFs
    const pdfBytes = await convertedPDF.save({ useObjectStreams: false });

    return SignPDF.unit8ToBuffer(pdfBytes);
  }

  /**
   * @return Promise<Buffer>
   */
  async signPDF() {
    let newPDF = await this._addPlaceholder();
    newPDF = signer.sign(newPDF, this.certificate);

    return newPDF;
  }
}
