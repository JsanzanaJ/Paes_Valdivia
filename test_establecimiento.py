import pdfplumber
import re
from pathlib import Path

PDF_PATH = Path("data/adm2024_tabla_frecuencias_6757_763.pdf")

with pdfplumber.open(PDF_PATH) as pdf:

    for i in range(4):  # páginas 1 a 4
        page = pdf.pages[i]
        text = page.extract_text() or ""

        print(f"\n========== TEXTO PÁGINA {i + 1} ==========\n")
        print(text)
        print("\n=========================================\n")

        # Buscar RBD
        rbd_match = re.search(
            r"RBD\s*-\s*COD\.\s*ENS\s*:\s*([0-9]+\s*-\s*[0-9]+)",
            text
        )

        # Buscar nombre
        nombre_match = re.search(
            r"NOMBRE\s*:\s*([A-ZÁÉÍÓÚÑ\s]+)",
            text
        )

        if rbd_match or nombre_match:
            print("🎯 DATOS ENCONTRADOS EN ESTA PÁGINA")
            print("🏫 NOMBRE :", nombre_match.group(1).strip() if nombre_match else None)
            print("🆔 RBD    :", rbd_match.group(1) if rbd_match else None)
            break