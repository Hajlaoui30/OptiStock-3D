import * as XLSX from 'xlsx';
import {
  SiemensExcelProductRow,
  ProductCategory,
  DEFAULT_SIEMENS_EXCEL_CATALOG,
  inferPackagingTypeFromDimensions,
} from './warehouseLogic';

function normalizeHeaderKey(key: string): string {
  return key
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

function parseCategory(raw: string): ProductCategory {
  const clean = (raw || '').toLowerCase();
  if (clean.includes('mec') || clean.includes('mot')) {
    return 'Mécanique';
  }
  if (clean.includes('hyd')) return 'Hydraulique';
  if (clean.includes('fix') || clean.includes('con')) return 'Fixation';
  if (clean.includes('maint') || clean.includes('cab')) return 'Maintenance';
  return 'Électronique';
}

/**
 * Parses an ArrayBuffer from an uploaded .xlsx, .xls, or .csv file into generic product rows.
 */
export function parseSiemensExcelBuffer(buffer: ArrayBuffer): SiemensExcelProductRow[] {
  const workbook = XLSX.read(buffer, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) return [];

  const sheet = workbook.Sheets[firstSheetName];
  const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: '',
  });

  const parsed: SiemensExcelProductRow[] = [];

  rawRows.forEach((row, idx) => {
    const normMap: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(row)) {
      normMap[normalizeHeaderKey(k)] = v;
    }

    const reference = String(
      normMap['reference'] ||
        normMap['ref'] ||
        normMap['code'] ||
        normMap['article'] ||
        normMap['sku'] ||
        normMap['mlfb'] ||
        ''
    ).trim();

    const name = String(
      normMap['designation'] ||
        normMap['nom'] ||
        normMap['description'] ||
        normMap['produit'] ||
        normMap['name'] ||
        reference
    ).trim();

    if (!reference && !name) return;

    const lengthCm = Math.max(
      0.1,
      Number(
        normMap['longueurcm'] ||
          normMap['longueur'] ||
          normMap['lengthcm'] ||
          normMap['l'] ||
          36
      ) || 36
    );
    const widthCm = Math.max(
      0.1,
      Number(
        normMap['largeurcm'] ||
          normMap['largeur'] ||
          normMap['widthcm'] ||
          normMap['w'] ||
          26
      ) || 26
    );
    const heightCm = Math.max(
      0.1,
      Number(
        normMap['hauteurcm'] ||
          normMap['hauteur'] ||
          normMap['heightcm'] ||
          normMap['h'] ||
          20
      ) || 20
    );
    const weightKg = Math.max(
      0.01,
      Number(
        normMap['poidskg'] || normMap['poids'] || normMap['weightkg'] || 2.0
      ) || 2.0
    );
    const quantity = Math.max(
      1,
      Math.round(
        Number(
          normMap['quantite'] ||
            normMap['qte'] ||
            normMap['stock'] ||
            normMap['qty'] ||
            normMap['quantity'] ||
            15
        ) || 15
      )
    );
    const turnoverRate = Math.max(
      1.0,
      Number(
        normMap['rotationannuelle'] ||
          normMap['rotation'] ||
          normMap['tauxrotation'] ||
          normMap['turnover'] ||
          16.0
      ) || 16.0
    );

    const categoryRaw = String(
      normMap['famille'] || normMap['categorie'] || normMap['category'] || 'Électronique'
    );
    const category = parseCategory(categoryRaw);
    const packagingType = inferPackagingTypeFromDimensions(lengthCm, widthCm, heightCm);

    parsed.push({
      id: `prod-xlsx-${Date.now().toString(36)}-${idx}`,
      reference: (reference || `REF-${idx + 1}`).toUpperCase(),
      name: name,
      category,
      packagingType,
      lengthCm: Math.round(lengthCm),
      widthCm: Math.round(widthCm),
      heightCm: Math.round(heightCm),
      weightKg: Number(weightKg.toFixed(1)),
      quantity,
      minThreshold: Math.max(2, Math.round(quantity * 0.25)),
      turnoverRate: Number(turnoverRate.toFixed(1)),
    });
  });

  return parsed;
}

/**
 * Generates and downloads a real .xlsx Excel file containing the product list with dimensions.
 */
export function downloadSiemensExcelTemplate(
  rows: SiemensExcelProductRow[] = DEFAULT_SIEMENS_EXCEL_CATALOG
): void {
  const sheetData = rows.map((r) => ({
    Reference: r.reference,
    Designation: r.name,
    Famille: r.category,
    Type_Emballage: r.packagingType,
    Longueur_cm: r.lengthCm,
    Largeur_cm: r.widthCm,
    Hauteur_cm: r.heightCm,
    Poids_kg: r.weightKg,
    Quantite_Stock: r.quantity,
    Rotation_Annuelle: r.turnoverRate,
  }));

  const worksheet = XLSX.utils.json_to_sheet(sheetData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Produits');
  XLSX.writeFile(workbook, 'Liste_Produits_Dimensions.xlsx');
}