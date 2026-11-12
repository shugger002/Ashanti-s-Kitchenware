#!/usr/bin/env python3
"""Load Joyce 2026-09-05 5th final list photos and TypeScript stock."""

from __future__ import annotations

import json
import re
from pathlib import Path

import pymupdf

PDF = Path(
    "/Users/shugger_dadie/.cursor/projects/Users-shugger-dadie-Asantis/attachments/79aa79df-2b3d-45ac-ac9d-ea65d805f7af/JOYCE_2026-09-05_5TH_Final_List_done.xlsx._-_Google_Sheets.pdf"
)
ROOT = Path("/Users/shugger_dadie/Asantis")
PUBLIC = ROOT / "public" / "products"

# sku, name, description, stock (T.QTY), category
ITEMS: list[tuple[str, str, str, int, str]] = [
    ("194-16", "Food warmer 15/25/35/50L", "Food warmer, 15/25/35/50L.", 10, "food-warmers"),
    ("HM-766", "Microwave oven 21L", "Microwave oven 21L.", 30, "microwave-ovens"),
    ("HM-2067", "Blender, BS plug", "Blender, BS plug.", 16, "blenders"),
    ("3330", "Rice barrel", "Rice barrel.", 15, "food-storage"),
    ("8800", "Rotating rice barrel", "Rotating rice barrel.", 18, "food-storage"),
    ("B01-03A", "3-floor shelf", "3-floor iron shelf.", 12, "furniture"),
    ("KD191-004", "5-layer shelf 80cm", "5-layer shelf, 80cm. Black 10 / white 5.", 15, "furniture"),
    ("KD68-12-5", "Folding 5-layer shelf", "Folding 5-layer shelf. Black 20 / white 5.", 25, "furniture"),
    ("BSY-1501", "Aluminium clothes rack", "Aluminium clothes rack, mixed colour.", 25, "home-essentials"),
    ("BSY-1201", "Aluminium clothes rack", "Aluminium clothes rack, mixed colour.", 25, "home-essentials"),
    ("MJ-3033", "3-layer shelf with wheels", "3-layer shelf with wheels, black and gold.", 12, "furniture"),
    ("MJ-5033", "5-layer shelf with wheels", "5-layer shelf with wheels, black and gold.", 15, "furniture"),
    ("TMT-ZW038", "3-layer shelf", "3-layer shelf. Black 10 / white 10.", 20, "furniture"),
    ("KD234-003", "5-layer rack, red", "5-layer magnetic rack, red.", 5, "furniture"),
    ("KD234-002", "4-layer rack, red", "4-layer magnetic rack, red.", 5, "furniture"),
    ("KD234-001", "3-layer rack, red", "3-layer magnetic rack, red.", 5, "furniture"),
    ("FB50", "Rice cooker, mixed colour", "Rice cooker, BS plug, mixed colour.", 40, "rice-cookers"),
    ("MMR-500", "Rice cooker, mixed colour", "Rice cooker, BS plug, mixed colour.", 20, "rice-cookers"),
    ("MMR-300", "Rice cooker, mixed colour", "Rice cooker, BS plug, mixed colour.", 20, "rice-cookers"),
    ("MMT9", "Rice cooker 5L", "Rice cooker, BS plug, mixed colour, 5L.", 8, "rice-cookers"),
    ("228-10", "10-inch bowl 25.3×7.8cm", "25.3×7.8cm bowl, 10 inch.", 170, "tableware"),
    ("w9-10.5", "10.5-inch plate 26.5×2.5cm", "26.5×2.5cm plate, 10.5 inch.", 150, "tableware"),
    ("921510", "10-inch plate 25×3.5cm", "25×3.5cm plate, 10 inch.", 120, "tableware"),
    ("637-10.5", "10.5-inch plate 26.5×2cm", "26.5×2cm plate, 10.5 inch.", 160, "tableware"),
    ("90519", "Tray 47×30cm", "47×30cm tray.", 24, "tableware"),
    ("954810", "10-inch bowl 25×7.5cm", "25×7.5cm bowl, 10 inch.", 80, "tableware"),
    ("UC-TS0912", "12-piece cookware set", "12-piece cookware set.", 20, "cookware-sets"),
    ("UC-8010", "10-piece cookware set", "10-piece cookware set, black/blue not wanted this load.", 24, "cookware-sets"),
    ("U-PS0107", "Cookware set", "Cookware set. This container: white only, 3 cartons.", 6, "cookware-sets"),
    ("UC-TS0810", "10-piece cookware set", "10-piece cookware set.", 10, "cookware-sets"),
    ("UC-TS0613", "13-piece cookware set", "13-piece cookware set.", 10, "cookware-sets"),
    ("557-1", "ZRWG 17-piece kitchen tools", "ZRWG 17-piece, 4-colour mix, 2160g, colour box.", 120, "cutlery"),
    ("557-2", "19-piece kitchen tools", "19-piece 2000g, 5-colour mix, colour box.", 120, "cutlery"),
    ("557-3", "LHF 6+1 kitchen tools", "LHF 6+1, light grey / deep grey / black, colour box.", 80, "cutlery"),
    ("557-4", "Soup ladle TX-123G", "TX-123G 36×10cm soup ladle, mixed colour, 04 card/OPP bag.", 144, "cutlery"),
    ("557-5", "TG10+1 10-piece kitchen tools", "TG10+1 10-piece, grey/khaki mix, colour box with cylinder.", 32, "cutlery"),
    ("003-1", "60L ice bucket with wheels", "60L ice bucket with wheels.", 10, "cool-boxes"),
    ("003-2", "Food warmer 17L L69", "L69 food warmer 17L, single tap.", 60, "food-warmers"),
    ("003-3", "Ice bucket 32/16L", "32/16L ice bucket.", 12, "cool-boxes"),
    ("003-4", "Folding laundry rack", "Folding laundry / clothes rack.", 18, "home-essentials"),
    ("003-5", "L172-8-3 chair", "L172-8-3 chair with back.", 60, "furniture"),
    ("003-6", "Folding chair", "Folding beach chair.", 125, "furniture"),
    ("003-7", "2165-2-94 shelf", "2165-2-94 rolling shelf.", 18, "furniture"),
    ("003-8", "L165 chair", "L165 chair with armrests.", 30, "furniture"),
    ("YMD-6002", "Double drain basket", "Double drain basket.", 160, "tableware"),
    ("71E-8375-4", "4-piece storage set", "4-piece transparent storage set.", 48, "food-storage"),
    ("11D-8001", "3-layer cabinet", "3-layer slim cabinet.", 10, "furniture"),
    ("11D-2026", "3-layer cabinet", "3-layer slim cabinet.", 10, "furniture"),
    ("958-1", "Food warmer bucket 60L", "Double-wall stainless food warmer bucket 60L / 40×49cm, silicone base.", 10, "food-warmers"),
    ("958-2", "5-piece cookware set 30–50cm", "Cookware set 5pcs 30/35/40/45/50cm.", 5, "cookware-sets"),
    ("958-3", "5-piece European soup-pot set", "Cookware set 5pcs 30/35/40/45/50cm, sand-finish European soup pots.", 10, "cookware-sets"),
    ("958-4", "Electric kettle 2.0L ST-8856", "Electric kettle 2.0L ST-8856.", 80, "kettles"),
    ("958-5", "Rice cooker 5.0L MA-550", "Rice cooker 5.0L MA-550.", 6, "rice-cookers"),
    ("958-6", "Rice cooker 5.0L MA-505", "Rice cooker 5.0L MA-505.", 4, "rice-cookers"),
    ("958-7", "22cm pot with lid", "22cm covered pot, mixed colour.", 48, "cooking-pots"),
    ("958-8", "Food warmer 3-piece 1.5/2.0/2.5L", "Food warmer bucket 3pcs 1.5L/2.0L/2.5L.", 36, "food-warmers"),
    ("958-9", "24cm pot", "24cm pot.", 40, "cooking-pots"),
    ("958-10", "Lunch box 2pcs 1400ml", "Lunch box 2pcs/1400ml, 6725-2.", 48, "food-storage"),
    ("958-12", "Hand vegetable cutter 2.0L C32", "Hand-operated vegetable cutter 2.0L C32.", 96, "kitchen-appliances"),
    ("958-13", "Lock handle", "Lock handle for lunch box.", 250, "home-essentials"),
    ("958-14", "5-piece youth soup-pot set", "Cookware set 5pcs 30/35/40/45/50cm.", 10, "cookware-sets"),
    ("958-15", "100-piece cookware set DLB21100-1", "Cookware set 100pcs DLB21100-1, blue glass lids.", 20, "cookware-sets"),
    ("958-16", "5-piece food warmer 4–60L", "Food warmer bucket 5pcs 4L/7L/15L/30L/60L.", 5, "food-warmers"),
    ("022-1", "3-piece food warmer", "3pcs food warmer bucket. Put English label within 48 hours.", 10, "food-warmers"),
    ("G-2570", "Ice cube tray, mixed colour", "7×24/2 ice cube tray, mixed colour, 3-grid with lid.", 144, "food-storage"),
    ("353-9214", "Rectangle crisper 4pcs", "24×19.5×10cm crisper 4pcs, rectangle, transparent.", 60, "food-storage"),
    ("353-9219", "Square crisper 4pcs", "21.5×21.5×10.5cm crisper 4pcs, square, transparent.", 60, "food-storage"),
    ("064-M-BL-9618", "Laundry basket, cream", "35.5×31.5×49.5cm wall laundry basket, large, cream.", 50, "home-essentials"),
    ("064-M-XN-8010", "Fold storage box", "62×39×60.3cm fold storage box, colours as pictured.", 15, "food-storage"),
    ("FX-8819", "Folding table, mixed colour", "Folding table, mixed colour.", 20, "furniture"),
    ("FX-8767-2", "Chair, coffee colour", "Chair, coffee colour.", 12, "furniture"),
    ("BM-C20PXP48", "Microwave oven", "Microwave oven.", 10, "microwave-ovens"),
    ("BM-20MX82-L", "Microwave oven, black mirror", "Microwave oven, black mirror surface.", 10, "microwave-ovens"),
    ("BM-710B", "Donut machine", "Donut machine.", 24, "kitchen-appliances"),
]


def ts_escape(value: str) -> str:
    return value.replace("\\", "\\\\").replace('"', '\\"')


def save_jpeg(pix: pymupdf.Pixmap, dest: Path) -> None:
    dest.parent.mkdir(parents=True, exist_ok=True)
    if pix.alpha or pix.n > 3:
        pix = pymupdf.Pixmap(pymupdf.csRGB, pix)
    dest.write_bytes(pix.tobytes("jpeg"))


def extract_photos() -> dict[str, str]:
    doc = pymupdf.open(PDF)
    mapping: dict[str, str] = {}
    idx = 0
    for page in doc:
        infos = [
            info
            for info in page.get_image_info(xrefs=True)
            if info["bbox"][3] - info["bbox"][1] >= 8 and info["bbox"][0] < 70
        ]
        infos.sort(key=lambda info: (info["bbox"][1], info["bbox"][0]))
        for info in infos:
            if idx >= len(ITEMS):
                break
            sku = ITEMS[idx][0]
            xref = info["xref"]
            pix = pymupdf.Pixmap(doc, xref)
            rel = f"/products/{sku}/01.jpg"
            save_jpeg(pix, ROOT / "public" / rel.lstrip("/"))
            mapping[sku] = rel
            idx += 1
    print(f"photos {len(mapping)} products {len(ITEMS)} leftover_images {idx}")
    return mapping


def write_ts(photos: dict[str, str]) -> None:
    stock_lines = [
        "export type AsanteStockItem = {",
        "  sku: string;",
        "  name: string;",
        "  description: string;",
        "  price: number;",
        "  stock: number;",
        "  category: string;",
        "};",
        "",
        "export const ASANTE_CONTAINER_STOCK: AsanteStockItem[] = [",
    ]
    for sku, name, description, stock, category in ITEMS:
        stock_lines.append(
            f'  {{ sku: "{ts_escape(sku)}", name: "{ts_escape(name)}", description: "{ts_escape(description)}", price: 1, stock: {stock}, category: "{category}" }},'
        )
    stock_lines.append("];")
    stock_lines.append("")
    (ROOT / "src/content/asante-container-stock.ts").write_text("\n".join(stock_lines))

    photo_lines = [
        "/** Packing-list photographs from Joyce 2026-09-05 5th final list. */",
        "export const ASANTE_CONTAINER_PHOTOS: Record<",
        "  string,",
        "  { files: string[]; source: string }",
        "> = {",
    ]
    for sku, rel in photos.items():
        photo_lines.append(
            f'  {json.dumps(sku)}: {{ source: "Joyce 2026-09-05 5th final list", files: [{json.dumps(rel)}] }},'
        )
    photo_lines.append("};")
    photo_lines.append("")
    (ROOT / "src/content/asante-container-photos.ts").write_text("\n".join(photo_lines))


if __name__ == "__main__":
    photos = extract_photos()
    write_ts(photos)
    print("wrote stock and photos")
