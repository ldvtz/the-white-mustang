import { PDFDocument, StandardFonts, rgb, type Color, type PDFFont } from 'pdf-lib'
import {
  buildRentalAgreementBlocks,
  rentalAgreementTitle,
  type RentalAgreementData,
} from './rentalAgreementContent'

const PAGE = { w: 595.28, h: 841.89 } // A4 in points
const MARGIN = 50
const BOTTOM = 56
const CONTENT_W = PAGE.w - MARGIN * 2

const charcoal = rgb(0.11, 0.11, 0.12)
const grey = rgb(0.557, 0.557, 0.576)
const ruby = rgb(0.784, 0.063, 0.18)
const fieldBorder = rgb(0.8, 0.8, 0.82)
const white = rgb(1, 1, 1)

/**
 * Renders the rental agreement as a print-ready A4 PDF with interactive,
 * customer-fillable AcroForm fields (incl. a signature field).
 * Returns the raw PDF bytes for use as an email attachment.
 */
export async function generateRentalAgreementPdf(data: RentalAgreementData): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  doc.setTitle(rentalAgreementTitle(data.locale))
  doc.setProducer('The White Mustang')

  const font = await doc.embedFont(StandardFonts.Helvetica)
  const bold = await doc.embedFont(StandardFonts.HelveticaBold)
  const form = doc.getForm()

  let page = doc.addPage([PAGE.w, PAGE.h])
  let y = PAGE.h - MARGIN

  const newPage = () => {
    page = doc.addPage([PAGE.w, PAGE.h])
    y = PAGE.h - MARGIN
  }
  const ensure = (needed: number) => {
    if (y - needed < BOTTOM) newPage()
  }

  const wrap = (text: string, f: PDFFont, size: number, maxW: number): string[] => {
    const lines: string[] = []
    let line = ''
    for (const word of text.split(/\s+/)) {
      const test = line ? `${line} ${word}` : word
      if (line && f.widthOfTextAtSize(test, size) > maxW) {
        lines.push(line)
        line = word
      } else {
        line = test
      }
    }
    if (line) lines.push(line)
    return lines
  }

  const drawParagraph = (
    text: string,
    opts: { font: PDFFont; size: number; color?: Color; lineHeight?: number; x?: number; maxW?: number },
  ) => {
    const x = opts.x ?? MARGIN
    const maxW = opts.maxW ?? CONTENT_W
    const lh = opts.lineHeight ?? opts.size + 4
    for (const ln of wrap(text, opts.font, opts.size, maxW)) {
      ensure(lh)
      page.drawText(ln, { x, y: y - opts.size, size: opts.size, font: opts.font, color: opts.color ?? charcoal })
      y -= lh
    }
  }

  for (const block of buildRentalAgreementBlocks(data)) {
    switch (block.kind) {
      case 'title':
        ensure(30)
        drawParagraph(block.text, { font: bold, size: 18, lineHeight: 22 })
        y -= 2
        break

      case 'subtitle':
        drawParagraph(block.text, { font, size: 9, color: grey, lineHeight: 12 })
        y -= 8
        break

      case 'h2':
        ensure(28)
        y -= 8
        page.drawText(block.text, { x: MARGIN, y: y - 12, size: 12, font: bold, color: charcoal })
        page.drawRectangle({ x: MARGIN, y: y - 17, width: 22, height: 2, color: ruby })
        y -= 20
        break

      case 'p':
        y -= 2
        drawParagraph(block.text, { font, size: 10, lineHeight: 14 })
        y -= 4
        break

      case 'li': {
        ensure(14)
        page.drawText('•', { x: MARGIN, y: y - 10, size: 10, font, color: ruby })
        drawParagraph(block.text, { font, size: 10, lineHeight: 14, x: MARGIN + 14, maxW: CONTENT_W - 14 })
        break
      }

      case 'kv': {
        const labelW = 150
        ensure(16)
        page.drawText(block.label, { x: MARGIN, y: y - 9, size: 9, font: bold, color: grey })
        const valueLines = wrap(block.value, font, 10, CONTENT_W - labelW)
        for (let i = 0; i < valueLines.length; i++) {
          if (i > 0) ensure(14)
          page.drawText(valueLines[i]!, { x: MARGIN + labelW, y: y - 10, size: 10, font, color: charcoal })
          y -= 14
        }
        break
      }

      case 'field': {
        const fw = block.width ?? CONTENT_W
        const fh = 16
        ensure(12 + fh + 8)
        page.drawText(block.label, { x: MARGIN, y: y - 8, size: 8, font, color: grey })
        y -= 12
        const tf = form.createTextField(`twm.${block.name}`)
        tf.addToPage(page, {
          x: MARGIN,
          y: y - fh,
          width: fw,
          height: fh,
          font,
          textColor: charcoal,
          backgroundColor: white,
          borderColor: fieldBorder,
          borderWidth: 1,
        })
        tf.setFontSize(10)
        y -= fh + 8
        break
      }

      case 'spacer':
        y -= block.height
        break
    }
  }

  form.updateFieldAppearances(font)
  return doc.save()
}
