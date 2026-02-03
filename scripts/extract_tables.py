import pdfplumber
import pandas as pd
import re
from pathlib import Path
import time

# =========================
# CONFIGURACIÓN
# =========================
PDF_DIR = Path("data/dataraw")
OUTPUT = Path("data/processed/paes_valdivia.csv")
OUTPUT.parent.mkdir(parents=True, exist_ok=True)

# =========================
# FUNCIONES
# =========================

def extraer_establecimiento(pdf, max_pages=4):
    for i in range(min(max_pages, len(pdf.pages))):
        text = pdf.pages[i].extract_text() or ""

        rbd_match = re.search(
            r"RBD\s*-\s*COD\.\s*ENS\s*:\s*([0-9]+\s*-\s*[0-9]+)",
            text
        )

        nombre_match = re.search(
            r"NOMBRE\s*:\s*([A-ZÁÉÍÓÚÑ\s]+)",
            text
        )

        if rbd_match and nombre_match:
            nombre = nombre_match.group(1).strip().title()
            rbd = rbd_match.group(1).replace(" ", "")
            return nombre, rbd

    return None, None


def detectar_prueba(texto):
    t = texto.upper()

    if "COMPETENCIA LECTORA" in t:
        return "Lenguaje"

    if "MATEMÁTICA 1" in t:
        return "M1"

    if "MATEMÁTICA 2" in t:
        return "M2"

    if "HISTORIA Y CIENCIAS SOCIALES" in t:
        return "Historia"

    if "CIENCIAS" in t and "HISTORIA" not in t:
        return "Ciencias"

    if "OBLIGATORIA" in t:
        return "Obligatoria"

    return None


def extraer_promedio_colegio(texto):
    """
    Extrae el promedio real del colegio desde la tabla superior.
    """
    match = re.search(r"PROMEDIO\s+([0-9]+(?:[.,][0-9]+)?)", texto)

    if match:
        return float(
            match.group(1)
            .replace(".", "")
            .replace(",", ".")
        )

    return None


# =========================
# PROCESO PRINCIPAL
# =========================
print("🚀 Iniciando extracción PAES")
inicio = time.time()

rows = []

for pdf_file in PDF_DIR.glob("adm*.pdf"):
    print(f"\n📄 Procesando: {pdf_file.name}")

    year_match = re.search(r"adm(\d{4})", pdf_file.name)
    anio = int(year_match.group(1)) if year_match else None

    with pdfplumber.open(pdf_file) as pdf:
        establecimiento, rbd = extraer_establecimiento(pdf)

        if not establecimiento or not rbd:
            print("   ⚠ No se pudo extraer establecimiento")
            continue

        for page in pdf.pages:
            text = page.extract_text() or ""
            if not text.strip():
                continue

            prueba = detectar_prueba(text)
            if not prueba:
                continue

            promedio = extraer_promedio_colegio(text)
            if promedio is None:
                continue

            rows.append({
                "anio": anio,
                "establecimiento": establecimiento,
                "rbd": rbd,
                "prueba": prueba,
                "promedio": promedio
            })

            print(f"✔ {establecimiento} | {prueba}: {promedio}")

# =========================
# SALIDA
# =========================
df = pd.DataFrame(rows)

df.to_csv(OUTPUT, index=False, encoding="utf-8")

print("\n📊 Extracción finalizada")
print(f"Filas totales: {len(df)}")
print(f"Archivo generado: {OUTPUT}")
print(f"Tiempo total: {time.time() - inicio:.2f}s")
print("✅ PROCESO COMPLETO")
