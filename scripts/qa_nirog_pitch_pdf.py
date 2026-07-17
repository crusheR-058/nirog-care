from pathlib import Path
import json
import shutil
import sys

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / ".pdf_deps"))

from PIL import Image, ImageDraw
import pypdfium2 as pdfium
from pypdf import PdfReader
import pdfplumber


PDF = ROOT / "output" / "pdf" / "Nirog_Care_Platform_Team_Pitch.pdf"
OUT = ROOT / "tmp" / "pdfs" / "nirog_pitch_pages"


def main():
    if OUT.exists():
        shutil.rmtree(OUT)
    OUT.mkdir(parents=True, exist_ok=True)

    doc = pdfium.PdfDocument(str(PDF))
    page_paths = []
    for i, page in enumerate(doc):
        bitmap = page.render(scale=1.7)
        image = bitmap.to_pil().convert("RGB")
        path = OUT / f"page-{i + 1:02d}.png"
        image.save(path, quality=95)
        page_paths.append(path)

    thumbs = []
    for path in page_paths:
        img = Image.open(path).convert("RGB")
        img.thumbnail((400, 285))
        thumbs.append(img.copy())
    cols = 2
    rows = (len(thumbs) + cols - 1) // cols
    sheet = Image.new("RGB", (cols * 420, rows * 315), "#DDE0E5")
    draw = ImageDraw.Draw(sheet)
    for i, img in enumerate(thumbs):
        x = (i % cols) * 420 + 10
        y = (i // cols) * 315 + 22
        sheet.paste(img, (x, y))
        draw.text((x, 5 + (i // cols) * 315), f"Page {i + 1:02d}", fill="#1D1D1F")
    contact = OUT / "contact-sheet.png"
    sheet.save(contact)

    reader = PdfReader(str(PDF))
    fields = reader.get_fields() or {}
    link_count = 0
    widget_count = 0
    for page in reader.pages:
        for annot_ref in page.get("/Annots", []):
            annot = annot_ref.get_object()
            subtype = annot.get("/Subtype")
            if subtype == "/Link":
                link_count += 1
            if subtype == "/Widget":
                widget_count += 1

    with pdfplumber.open(str(PDF)) as pdf:
        text_lengths = [len((page.extract_text() or "").strip()) for page in pdf.pages]

    report = {
        "pdf": str(PDF),
        "pages": len(reader.pages),
        "rendered_pages": len(page_paths),
        "form_fields": len(fields),
        "field_names": sorted(fields.keys()),
        "widget_annotations": widget_count,
        "link_annotations": link_count,
        "text_lengths": text_lengths,
        "contact_sheet": str(contact),
        "file_size_bytes": PDF.stat().st_size,
    }
    report_path = OUT / "qa-report.json"
    report_path.write_text(json.dumps(report, indent=2), encoding="utf-8")
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
