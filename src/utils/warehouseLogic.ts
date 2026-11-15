export type PackagingType =
  | 'Bac Europe S'
  | 'Carton Standard M'
  | 'Caisse Renforcée L'
  | 'Coffre Lourd XL'
  | 'Tube / Rouleau';

export type ProductCategory =
  | 'Mécanique'
  | 'Électronique'
  | 'Hydraulique'
  | 'Fixation'
  | 'Maintenance';

export interface PackagingDimensions {
  lengthCm: number;
  widthCm: number;
  heightCm: number;
}

export interface ProductItem {
  id: string;
  reference: string; // e.g. "6ES7511-1AK02-0AB0"
  name: string;
  category: ProductCategory;
  quantity: number;
  minThreshold: number;
  maxCapacity: number;
  packagingType: PackagingType;
  dimensionsCm: PackagingDimensions;
  weightKg: number;
  turnoverRate: number; // Annual inventory turns (rotations/an)
  lastUpdated: string;
  scannedFromImage?: boolean;
}

export interface BinCase {
  id: string;
  cabinetId: string;
  cabinetCode: string;
  shelfIndex: number; // 1-indexed (1 = bottom shelf, N = top shelf)
  colIndex: number; // 1-indexed (1 = leftmost case on this shelf, K = rightmost case on this shelf)
  code: string; // e.g., "ARM-A1-E2-C3"
  /**
   * Share of the shelf's usable inner width (0.01 to 1.0).
   * Cases on the same shelf can have DIFFERENT widthRatios and different counts per shelf.
   */
  widthRatio?: number;
  maxVolumeCm3: number;
  product: ProductItem | null;
}

export interface ShelfBinGeometry {
  bin: BinCase;
  widthRatio: number;
  startRatio: number; // 0.0 to 1.0 from left edge of shelf
  centerRatio: number; // 0.0 to 1.0 center position
  widthMeters: number;
  widthCm: number;
  shelfHeightCm: number;
  shelfHeightMeters: number;
  fitsProductDimensionally: boolean;
}

export interface RoomDimensions {
  widthMeters: number; // X axis total width (any positive dimension in meters)
  depthMeters: number; // Z axis total depth (any positive dimension in meters)
  heightMeters: number; // Ceiling height
  gridStepMeters: number; // Snap grid step (e.g., 0.1m, 0.25m, 0.5m)
}

export const DEFAULT_ROOM_DIMENSIONS: RoomDimensions = {
  widthMeters: 20,
  depthMeters: 16,
  heightMeters: 6.0,
  gridStepMeters: 0.25,
};

export interface Cabinet {
  id: string;
  code: string; // e.g., "ARM-A1"
  name: string; // e.g., "Armoire A1 — Siemens SIMATIC S7-1500 & ET 200SP"
  zone: string; // e.g., "Zone A · Accès Rapide Siemens"
  position: { x: number; z: number };
  rotationY: number; // in degrees (0, 90, 180, 270)
  shelvesCount: number; // number of horizontal shelves (étagères)
  columnsCount: number; // nominal columns reference
  /**
   * Custom height in cm for each shelf (1-indexed via array index s-1).
   * No minimum restriction: any positive value in cm.
   */
  shelfHeightsCm?: number[];
  widthMeters: number;
  heightMeters: number;
  depthMeters: number;
  accentColor: string;
  bins: BinCase[];
}

export interface SiemensExcelProductRow {
  id: string;
  reference: string; // Siemens MLFB e.g. "6ES7511-1AK02-0AB0"
  name: string;
  category: ProductCategory;
  packagingType: PackagingType;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  weightKg: number;
  quantity: number;
  minThreshold: number;
  turnoverRate: number;
}

export interface ScannedShelfItem {
  reference: string;
  name: string;
  category: ProductCategory;
  quantity: number;
  minThreshold?: number;
  packagingType: PackagingType;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  weightKg?: number;
  turnoverRate: number;
  targetColIndex: number;
}

export interface SlottingRecommendation {
  id: string;
  priority: 'Haute' | 'Moyenne';
  reason: string;
  impactMetric: string;
  sourceBinId: string;
  sourceBinCode: string;
  sourceProductRef: string;
  sourceProductName: string;
  sourceTurnover: number;
  targetBinId: string;
  targetBinCode: string;
  targetCurrentProductRef: string | null;
}

export interface CabinetAnalytics {
  cabinetId: string;
  cabinetCode: string;
  cabinetName: string;
  totalBins: number;
  occupiedBins: number;
  occupancyPercent: number;
  avgTurnoverRate: number;
  totalUnits: number;
}

export interface AnalyticsSummary {
  totalCabinets: number;
  totalBins: number;
  occupiedBins: number;
  occupancyPercent: number;
  totalDistinctProducts: number;
  totalUnitsInStock: number;
  avgTurnoverRate: number;
  lowStockCount: number;
  totalPackagingVolumeM3: number;
  ergonomicSlottingScore: number; // 0 to 100
  abcDistribution: {
    classA: { count: number; percent: number; label: string }; // turnover >= 14
    classB: { count: number; percent: number; label: string }; // turnover 7 - 13.9
    classC: { count: number; percent: number; label: string }; // turnover < 7
  };
  packagingBreakdown: Record<PackagingType, number>;
  cabinetMetrics: CabinetAnalytics[];
}

export type ColorMode3D = 'standard' | 'rotation' | 'occupancy';

export const PACKAGING_PRESETS: Record<
  PackagingType,
  { dimensionsCm: PackagingDimensions; defaultMaxCap: number; badgeColor: string }
> = {
  'Bac Europe S': {
    dimensionsCm: { lengthCm: 30, widthCm: 20, heightCm: 15 },
    defaultMaxCap: 50,
    badgeColor: '#38bdf8',
  },
  'Carton Standard M': {
    dimensionsCm: { lengthCm: 40, widthCm: 30, heightCm: 22 },
    defaultMaxCap: 30,
    badgeColor: '#fbbf24',
  },
  'Caisse Renforcée L': {
    dimensionsCm: { lengthCm: 50, widthCm: 35, heightCm: 28 },
    defaultMaxCap: 18,
    badgeColor: '#f97316',
  },
  'Coffre Lourd XL': {
    dimensionsCm: { lengthCm: 60, widthCm: 45, heightCm: 38 },
    defaultMaxCap: 10,
    badgeColor: '#a855f7',
  },
  'Tube / Rouleau': {
    dimensionsCm: { lengthCm: 55, widthCm: 16, heightCm: 16 },
    defaultMaxCap: 25,
    badgeColor: '#10b981',
  },
};

export const DEFAULT_SIEMENS_EXCEL_CATALOG: SiemensExcelProductRow[] = [
  {
    id: 'prod-gen-01',
    reference: 'SKU-DRV-750',
    name: 'Variateur Industriel 7.5kW Triphasé',
    category: 'Électronique',
    packagingType: 'Coffre Lourd XL',
    lengthCm: 62,
    widthCm: 48,
    heightCm: 38,
    weightKg: 16.4,
    quantity: 6,
    minThreshold: 2,
    turnoverRate: 11.2,
  },
  {
    id: 'prod-gen-02',
    reference: 'SKU-MOT-100',
    name: 'Servomoteur Synchrone 1.0kW IP65',
    category: 'Mécanique',
    packagingType: 'Coffre Lourd XL',
    lengthCm: 58,
    widthCm: 44,
    heightCm: 36,
    weightKg: 14.8,
    quantity: 5,
    minThreshold: 2,
    turnoverRate: 9.6,
  },
  {
    id: 'prod-gen-03',
    reference: 'SKU-DRV-150',
    name: 'Variateur Compact 1.5kW Modulaire',
    category: 'Électronique',
    packagingType: 'Caisse Renforcée L',
    lengthCm: 48,
    widthCm: 36,
    heightCm: 28,
    weightKg: 4.8,
    quantity: 11,
    minThreshold: 4,
    turnoverRate: 17.5,
  },
  {
    id: 'prod-gen-04',
    reference: 'SKU-PLC-120',
    name: 'Automate Programmable Modulaire 24V',
    category: 'Électronique',
    packagingType: 'Bac Europe S',
    lengthCm: 28,
    widthCm: 20,
    heightCm: 15,
    weightKg: 1.2,
    quantity: 12,
    minThreshold: 4,
    turnoverRate: 25.8,
  },
  {
    id: 'prod-gen-05',
    reference: 'SKU-CNT-025',
    name: 'Contacteur de Puissance 25A 24V DC',
    category: 'Électronique',
    packagingType: 'Bac Europe S',
    lengthCm: 24,
    widthCm: 16,
    heightCm: 14,
    weightKg: 0.7,
    quantity: 48,
    minThreshold: 15,
    turnoverRate: 24.6,
  },
  {
    id: 'prod-gen-06',
    reference: 'SKU-CPU-150',
    name: 'Unité Centrale Haute Performance Ethernet',
    category: 'Électronique',
    packagingType: 'Carton Standard M',
    lengthCm: 35,
    widthCm: 28,
    heightCm: 20,
    weightKg: 1.9,
    quantity: 18,
    minThreshold: 5,
    turnoverRate: 23.4,
  },
  {
    id: 'prod-gen-07',
    reference: 'SKU-HYD-250',
    name: 'Pompe à Engrenages Hydraulique 250 Bar',
    category: 'Hydraulique',
    packagingType: 'Caisse Renforcée L',
    lengthCm: 45,
    widthCm: 32,
    heightCm: 26,
    weightKg: 9.2,
    quantity: 8,
    minThreshold: 3,
    turnoverRate: 13.8,
  },
  {
    id: 'prod-gen-08',
    reference: 'SKU-ROU-620',
    name: 'Lot Roulements Haute Vitesse x10',
    category: 'Mécanique',
    packagingType: 'Bac Europe S',
    lengthCm: 26,
    widthCm: 18,
    heightCm: 12,
    weightKg: 1.5,
    quantity: 36,
    minThreshold: 10,
    turnoverRate: 22.1,
  },
  {
    id: 'prod-gen-09',
    reference: 'SKU-ALM-024',
    name: 'Alimentation Découpée Rail-DIN 24V/10A',
    category: 'Électronique',
    packagingType: 'Carton Standard M',
    lengthCm: 34,
    widthCm: 26,
    heightCm: 20,
    weightKg: 2.4,
    quantity: 22,
    minThreshold: 6,
    turnoverRate: 19.3,
  },
  {
    id: 'prod-gen-10',
    reference: 'SKU-IHM-007',
    name: 'Écran Tactile IHM Industriel 7 pouces',
    category: 'Électronique',
    packagingType: 'Carton Standard M',
    lengthCm: 38,
    widthCm: 30,
    heightCm: 22,
    weightKg: 2.1,
    quantity: 14,
    minThreshold: 4,
    turnoverRate: 18.2,
  },
  {
    id: 'prod-gen-11',
    reference: 'SKU-SWT-008',
    name: 'Switch Réseau Industriel 8 Ports Gigabit',
    category: 'Électronique',
    packagingType: 'Carton Standard M',
    lengthCm: 32,
    widthCm: 25,
    heightCm: 18,
    weightKg: 1.7,
    quantity: 16,
    minThreshold: 4,
    turnoverRate: 16.8,
  },
  {
    id: 'prod-gen-12',
    reference: 'SKU-FIX-100',
    name: 'Coffret Visserie & Fixations Inox A4',
    category: 'Fixation',
    packagingType: 'Bac Europe S',
    lengthCm: 28,
    widthCm: 20,
    heightCm: 15,
    weightKg: 3.8,
    quantity: 30,
    minThreshold: 8,
    turnoverRate: 20.4,
  },
];

export function formatBinCode(cabinetCode: string, shelfIndex: number, colIndex: number): string {
  return `${cabinetCode}-E${shelfIndex}-C${colIndex}`;
}

export function calculatePackageVolumeCm3(dim: PackagingDimensions): number {
  return Math.max(1, Math.round(dim.lengthCm * dim.widthCm * dim.heightCm));
}

export function getABCClass(turnoverRate: number): 'A' | 'B' | 'C' {
  if (turnoverRate >= 14) return 'A';
  if (turnoverRate >= 7) return 'B';
  return 'C';
}

export function inferPackagingTypeFromDimensions(
  lengthCm: number,
  widthCm: number,
  heightCm: number
): PackagingType {
  if (widthCm >= 40 || heightCm >= 32 || lengthCm >= 56) return 'Coffre Lourd XL';
  if (widthCm >= 33 || heightCm >= 25 || lengthCm >= 45) return 'Caisse Renforcée L';
  if (widthCm <= 18 && lengthCm >= 48) return 'Tube / Rouleau';
  if (widthCm >= 24 || heightCm >= 18 || lengthCm >= 33) return 'Carton Standard M';
  return 'Bac Europe S';
}

/**
 * Normalizes widthRatios for all bins on a single shelf so they sum to 1.0
 * and re-indexes colIndex 1..K from left to right. No artificial minimum widthCm!
 */
export function normalizeShelfBins(
  cabinetId: string,
  cabinetCode: string,
  shelfIndex: number,
  shelfBins: BinCase[],
  innerWidthCm: number = 340,
  shelfHeightCm: number = 45
): BinCase[] {
  const sorted = [...shelfBins].sort((a, b) => a.colIndex - b.colIndex);
  if (sorted.length === 0) return [];

  const rawRatios = sorted.map((b) =>
    typeof b.widthRatio === 'number' && b.widthRatio > 0.005 ? b.widthRatio : 1 / sorted.length
  );
  const sum = rawRatios.reduce((acc, r) => acc + r, 0) || 1;

  return sorted.map((b, idx) => {
    const colIndex = idx + 1;
    const widthRatio = Number((rawRatios[idx] / sum).toFixed(4));
    const caseWidthCm = Math.max(1, Math.round(innerWidthCm * widthRatio));
    const maxVolumeCm3 = Math.max(1, Math.round(caseWidthCm * shelfHeightCm * 85));
    return {
      ...b,
      cabinetId,
      cabinetCode,
      shelfIndex,
      colIndex,
      code: formatBinCode(cabinetCode, shelfIndex, colIndex),
      widthRatio,
      maxVolumeCm3,
    };
  });
}

/**
 * Returns the shelf height in cm for a given 1-indexed shelfIndex (no minimum clamp, >= 1cm).
 */
export function getShelfHeightCm(
  cabinet: Pick<Cabinet, 'shelvesCount' | 'shelfHeightsCm' | 'heightMeters'>,
  shelfIndex: number
): number {
  if (
    cabinet.shelfHeightsCm &&
    Array.isArray(cabinet.shelfHeightsCm) &&
    typeof cabinet.shelfHeightsCm[shelfIndex - 1] === 'number'
  ) {
    return Math.max(1, Math.round(cabinet.shelfHeightsCm[shelfIndex - 1]));
  }
  if (shelfIndex === 1) return 52;
  if (shelfIndex === 2) return 44;
  return 38;
}

/**
 * Computes exact horizontal startRatio, widthRatio, widthCm, and dimensional fit for every bin on a given shelf.
 */
export function getShelfBinsWithGeometry(
  cabinet: Cabinet,
  shelfIndex: number
): ShelfBinGeometry[] {
  const innerWidthMeters = Math.max(0.05, cabinet.widthMeters);
  const innerWidthCm = innerWidthMeters * 100;
  const shelfHeightCm = getShelfHeightCm(cabinet, shelfIndex);
  const shelfHeightMeters = shelfHeightCm / 100;

  const rawShelfBins = cabinet.bins
    .filter((b) => b.shelfIndex === shelfIndex)
    .sort((a, b) => a.colIndex - b.colIndex);

  if (rawShelfBins.length === 0) return [];

  const rawRatios = rawShelfBins.map((b) =>
    typeof b.widthRatio === 'number' && b.widthRatio > 0.005
      ? b.widthRatio
      : 1 / rawShelfBins.length
  );
  const ratioSum = rawRatios.reduce((a, b) => a + b, 0) || 1;

  let cumulative = 0;
  return rawShelfBins.map((bin, idx) => {
    const widthRatio = rawRatios[idx] / ratioSum;
    const startRatio = cumulative;
    const centerRatio = startRatio + widthRatio / 2;
    cumulative += widthRatio;

    const widthMeters = Number((innerWidthMeters * widthRatio).toFixed(3));
    const widthCm = Math.max(1, Math.round(innerWidthCm * widthRatio));

    const fitsProductDimensionally = bin.product
      ? bin.product.dimensionsCm.widthCm <= widthCm + 2 &&
        bin.product.dimensionsCm.heightCm <= shelfHeightCm + 2
      : true;

    return {
      bin,
      widthRatio,
      startRatio,
      centerRatio,
      widthMeters,
      widthCm,
      shelfHeightCm,
      shelfHeightMeters,
      fitsProductDimensionally,
    };
  });
}

export function buildEmptyBins(
  cabinetId: string,
  cabinetCode: string,
  shelvesCount: number,
  columnsCount: number,
  existingBins: BinCase[] = [],
  shelfCustomRatios?: Record<number, number[]>
): BinCase[] {
  const allBins: BinCase[] = [];

  for (let s = 1; s <= shelvesCount; s++) {
    const existingOnShelf = existingBins
      .filter((b) => b.shelfIndex === s)
      .sort((a, b) => a.colIndex - b.colIndex);

    const customRatios = shelfCustomRatios?.[s];

    if (customRatios && customRatios.length > 0) {
      const shelfBins: BinCase[] = customRatios.map((ratio, idx) => {
        const c = idx + 1;
        const prev = existingOnShelf[idx];
        const code = formatBinCode(cabinetCode, s, c);
        return {
          id: prev?.id || `bin-${cabinetId}-s${s}-c${c}`,
          cabinetId,
          cabinetCode,
          shelfIndex: s,
          colIndex: c,
          code,
          widthRatio: ratio,
          maxVolumeCm3: 120000,
          product: prev?.product ?? null,
        };
      });
      allBins.push(...normalizeShelfBins(cabinetId, cabinetCode, s, shelfBins));
    } else if (existingOnShelf.length > 0) {
      allBins.push(...normalizeShelfBins(cabinetId, cabinetCode, s, existingOnShelf));
    } else {
      const shelfBins: BinCase[] = [];
      for (let c = 1; c <= columnsCount; c++) {
        const code = formatBinCode(cabinetCode, s, c);
        shelfBins.push({
          id: `bin-${cabinetId}-s${s}-c${c}`,
          cabinetId,
          cabinetCode,
          shelfIndex: s,
          colIndex: c,
          code,
          widthRatio: Number((1 / columnsCount).toFixed(4)),
          maxVolumeCm3: 120000,
          product: null,
        });
      }
      allBins.push(...normalizeShelfBins(cabinetId, cabinetCode, s, shelfBins));
    }
  }
  return allBins;
}

/**
 * Adds a new case specifically to a single shelf (`shelfIndex`) without changing other shelves.
 */
export function addBinToShelf(
  cabinets: Cabinet[],
  cabinetId: string,
  shelfIndex: number,
  newWidthRatio?: number
): Cabinet[] {
  return cabinets.map((cab) => {
    if (cab.id !== cabinetId) return cab;
    const otherBins = cab.bins.filter((b) => b.shelfIndex !== shelfIndex);
    const shelfBins = cab.bins
      .filter((b) => b.shelfIndex === shelfIndex)
      .sort((a, b) => a.colIndex - b.colIndex);

    if (shelfBins.length >= 20) return cab;

    const nextCol = shelfBins.length + 1;
    const targetRatio = newWidthRatio ?? 1 / nextCol;
    const scaleExisting = Math.max(0.05, 1 - targetRatio);

    const rescaledExisting = shelfBins.map((b) => ({
      ...b,
      widthRatio: (b.widthRatio ?? 1 / shelfBins.length) * scaleExisting,
    }));

    const newBin: BinCase = {
      id: `bin-${cab.id}-s${shelfIndex}-c${nextCol}-${Date.now().toString(36).slice(-3)}`,
      cabinetId: cab.id,
      cabinetCode: cab.code,
      shelfIndex,
      colIndex: nextCol,
      code: formatBinCode(cab.code, shelfIndex, nextCol),
      widthRatio: targetRatio,
      maxVolumeCm3: 110000,
      product: null,
    };

    const innerWidthCm = Math.max(1, Math.round(cab.widthMeters * 100));
    const normalized = normalizeShelfBins(
      cab.id,
      cab.code,
      shelfIndex,
      [...rescaledExisting, newBin],
      innerWidthCm,
      getShelfHeightCm(cab, shelfIndex)
    );

    return {
      ...cab,
      bins: [...otherBins, ...normalized].sort(
        (a, b) => a.shelfIndex - b.shelfIndex || a.colIndex - b.colIndex
      ),
    };
  });
}

/**
 * Removes a specific case (or the rightmost case) from a single shelf (`shelfIndex`).
 */
export function removeBinFromShelf(
  cabinets: Cabinet[],
  cabinetId: string,
  shelfIndex: number,
  binIdToRemove?: string
): Cabinet[] {
  return cabinets.map((cab) => {
    if (cab.id !== cabinetId) return cab;
    const otherBins = cab.bins.filter((b) => b.shelfIndex !== shelfIndex);
    const shelfBins = cab.bins
      .filter((b) => b.shelfIndex === shelfIndex)
      .sort((a, b) => a.colIndex - b.colIndex);

    if (shelfBins.length <= 1) return cab;

    const filtered = binIdToRemove
      ? shelfBins.filter((b) => b.id !== binIdToRemove)
      : shelfBins.slice(0, shelfBins.length - 1);

    const innerWidthCm = Math.max(1, Math.round(cab.widthMeters * 100));
    const normalized = normalizeShelfBins(
      cab.id,
      cab.code,
      shelfIndex,
      filtered,
      innerWidthCm,
      getShelfHeightCm(cab, shelfIndex)
    );

    return {
      ...cab,
      bins: [...otherBins, ...normalized].sort(
        (a, b) => a.shelfIndex - b.shelfIndex || a.colIndex - b.colIndex
      ),
    };
  });
}

/**
 * Moves the vertical divider between `leftColIndex` and `leftColIndex + 1` on `shelfIndex`
 * with no restrictive minimum width (allows resizing down to 1%).
 */
export function resizeShelfBinDivider(
  cabinets: Cabinet[],
  cabinetId: string,
  shelfIndex: number,
  leftColIndex: number,
  deltaRatio: number
): Cabinet[] {
  return cabinets.map((cab) => {
    if (cab.id !== cabinetId) return cab;
    const otherBins = cab.bins.filter((b) => b.shelfIndex !== shelfIndex);
    const shelfBins = cab.bins
      .filter((b) => b.shelfIndex === shelfIndex)
      .sort((a, b) => a.colIndex - b.colIndex);

    const leftIdx = leftColIndex - 1;
    const rightIdx = leftColIndex;
    if (leftIdx < 0 || rightIdx >= shelfBins.length) return cab;

    const minRatio = 0.01;
    const leftCurrent = shelfBins[leftIdx].widthRatio ?? 1 / shelfBins.length;
    const rightCurrent = shelfBins[rightIdx].widthRatio ?? 1 / shelfBins.length;
    const pairTotal = leftCurrent + rightCurrent;

    const nextLeft = Math.max(
      minRatio,
      Math.min(pairTotal - minRatio, leftCurrent + deltaRatio)
    );
    const nextRight = Math.max(minRatio, pairTotal - nextLeft);

    const updatedShelf = shelfBins.map((b, idx) => {
      if (idx === leftIdx) return { ...b, widthRatio: Number(nextLeft.toFixed(4)) };
      if (idx === rightIdx) return { ...b, widthRatio: Number(nextRight.toFixed(4)) };
      return b;
    });

    const innerWidthCm = Math.max(1, Math.round(cab.widthMeters * 100));
    const normalized = normalizeShelfBins(
      cab.id,
      cab.code,
      shelfIndex,
      updatedShelf,
      innerWidthCm,
      getShelfHeightCm(cab, shelfIndex)
    );

    return {
      ...cab,
      bins: [...otherBins, ...normalized].sort(
        (a, b) => a.shelfIndex - b.shelfIndex || a.colIndex - b.colIndex
      ),
    };
  });
}

/**
 * Directly sets a bin's width in cm on its shelf (no artificial minimum, >= 1 cm).
 */
export function setShelfBinWidthCm(
  cabinets: Cabinet[],
  binId: string,
  targetWidthCm: number
): Cabinet[] {
  return cabinets.map((cab) => {
    const targetBin = cab.bins.find((b) => b.id === binId);
    if (!targetBin) return cab;

    const shelfIndex = targetBin.shelfIndex;
    const innerWidthCm = Math.max(1, Math.round(cab.widthMeters * 100));
    const shelfBins = cab.bins
      .filter((b) => b.shelfIndex === shelfIndex)
      .sort((a, b) => a.colIndex - b.colIndex);

    if (shelfBins.length <= 1) return cab;

    const desiredRatio = Math.max(0.01, Math.min(0.99, targetWidthCm / innerWidthCm));
    const remainingRatio = Math.max(0.01, 1 - desiredRatio);
    const otherBinsSum =
      shelfBins
        .filter((b) => b.id !== binId)
        .reduce((acc, b) => acc + (b.widthRatio ?? 1 / shelfBins.length), 0) || 1;

    const updatedShelf = shelfBins.map((b) => {
      if (b.id === binId) {
        return { ...b, widthRatio: desiredRatio };
      }
      const prevR = b.widthRatio ?? 1 / shelfBins.length;
      return { ...b, widthRatio: (prevR / otherBinsSum) * remainingRatio };
    });

    const otherShelfBins = cab.bins.filter((b) => b.shelfIndex !== shelfIndex);
    const normalized = normalizeShelfBins(
      cab.id,
      cab.code,
      shelfIndex,
      updatedShelf,
      innerWidthCm,
      getShelfHeightCm(cab, shelfIndex)
    );

    return {
      ...cab,
      bins: [...otherShelfBins, ...normalized].sort(
        (a, b) => a.shelfIndex - b.shelfIndex || a.colIndex - b.colIndex
      ),
    };
  });
}

/**
 * Applies a custom unequal or equal ratio split to a specific shelf.
 */
export function applyShelfPresetLayout(
  cabinets: Cabinet[],
  cabinetId: string,
  shelfIndex: number,
  ratios: number[]
): Cabinet[] {
  if (!ratios.length) return cabinets;
  return cabinets.map((cab) => {
    if (cab.id !== cabinetId) return cab;
    const otherBins = cab.bins.filter((b) => b.shelfIndex !== shelfIndex);
    const existingShelfBins = cab.bins
      .filter((b) => b.shelfIndex === shelfIndex)
      .sort((a, b) => a.colIndex - b.colIndex);

    const newShelfBins: BinCase[] = ratios.map((r, idx) => {
      const colIndex = idx + 1;
      const prev = existingShelfBins[idx];
      return {
        id:
          prev?.id ||
          `bin-${cab.id}-s${shelfIndex}-c${colIndex}-${Date.now().toString(36).slice(-3)}`,
        cabinetId: cab.id,
        cabinetCode: cab.code,
        shelfIndex,
        colIndex,
        code: formatBinCode(cab.code, shelfIndex, colIndex),
        widthRatio: r,
        maxVolumeCm3: 120000,
        product: prev?.product ?? null,
      };
    });

    const innerWidthCm = Math.max(1, Math.round(cab.widthMeters * 100));
    const normalized = normalizeShelfBins(
      cab.id,
      cab.code,
      shelfIndex,
      newShelfBins,
      innerWidthCm,
      getShelfHeightCm(cab, shelfIndex)
    );

    return {
      ...cab,
      bins: [...otherBins, ...normalized].sort(
        (a, b) => a.shelfIndex - b.shelfIndex || a.colIndex - b.colIndex
      ),
    };
  });
}

/**
 * Updates the height in cm of a specific shelf (`shelfIndex`) with no artificial minimum (>= 1 cm).
 */
export function updateShelfHeightCm(
  cabinets: Cabinet[],
  cabinetId: string,
  shelfIndex: number,
  heightCm: number
): Cabinet[] {
  return cabinets.map((cab) => {
    if (cab.id !== cabinetId) return cab;
    const clampedCm = Math.max(1, Math.round(heightCm));
    const nextHeights: number[] = [];
    for (let s = 1; s <= cab.shelvesCount; s++) {
      nextHeights.push(s === shelfIndex ? clampedCm : getShelfHeightCm(cab, s));
    }
    const totalShelfMeters = nextHeights.reduce((acc, h) => acc + h / 100, 0);
    const heightMeters = Number(Math.max(0.1, totalShelfMeters + 0.2).toFixed(2));
    return {
      ...cab,
      shelfHeightsCm: nextHeights,
      heightMeters,
    };
  });
}

/**
 * Automatically organizes a list of Siemens products into the target cabinet's shelves in 2D.
 */
export function autoOrganizeSiemensProductsInCabinet(
  cabinets: Cabinet[],
  cabinetId: string,
  products: SiemensExcelProductRow[]
): { updatedCabinets: Cabinet[]; placedCount: number } {
  const targetCab = cabinets.find((c) => c.id === cabinetId);
  if (!targetCab || products.length === 0) {
    return { updatedCabinets: cabinets, placedCount: 0 };
  }

  const nowIso = new Date().toISOString().split('T')[0];
  const shelvesCount = targetCab.shelvesCount;
  const innerWidthCm = Math.max(10, Math.round(targetCab.widthMeters * 100));

  const heavyOrLarge = products
    .filter((p) => p.weightKg >= 5.0 || p.heightCm >= 26 || p.widthCm >= 35)
    .sort((a, b) => b.weightKg - a.weightKg);

  const remaining = products
    .filter((p) => !heavyOrLarge.some((h) => h.reference === p.reference))
    .sort((a, b) => b.turnoverRate - a.turnoverRate);

  const shelfBuckets: Map<number, SiemensExcelProductRow[]> = new Map();
  for (let s = 1; s <= shelvesCount; s++) {
    shelfBuckets.set(s, []);
  }

  heavyOrLarge.slice(0, 3).forEach((p) => shelfBuckets.get(1)!.push(p));

  const shelfPriorityOrder =
    shelvesCount >= 4
      ? [2, 3, 4, 1]
      : shelvesCount === 3
      ? [2, 3, 1]
      : [1, 2];

  let ptr = 0;
  for (const prod of remaining) {
    let placed = false;
    for (const s of shelfPriorityOrder) {
      const bucket = shelfBuckets.get(s)!;
      const usedWidthCm = bucket.reduce((sum, item) => sum + item.widthCm + 8, 0);
      if (bucket.length < 5 && usedWidthCm + prod.widthCm + 4 <= innerWidthCm) {
        bucket.push(prod);
        placed = true;
        break;
      }
    }
    if (!placed) {
      const fallbackShelf = shelfPriorityOrder[ptr % shelfPriorityOrder.length];
      if (shelfBuckets.get(fallbackShelf)!.length < 6) {
        shelfBuckets.get(fallbackShelf)!.push(prod);
      }
      ptr++;
    }
  }

  let placedCount = 0;
  const newBins: BinCase[] = [];
  const nextShelfHeightsCm: number[] = [];

  for (let s = 1; s <= shelvesCount; s++) {
    const bucket = shelfBuckets.get(s) || [];
    if (bucket.length === 0) {
      const existingOnShelf = targetCab.bins.filter((b) => b.shelfIndex === s);
      nextShelfHeightsCm.push(getShelfHeightCm(targetCab, s));
      newBins.push(
        ...normalizeShelfBins(
          targetCab.id,
          targetCab.code,
          s,
          existingOnShelf,
          innerWidthCm,
          nextShelfHeightsCm[s - 1]
        )
      );
      continue;
    }

    const totalProdWidthCm = bucket.reduce((sum, p) => sum + Math.max(10, p.widthCm + 18), 0);
    const includeSpareEmptyCase = totalProdWidthCm < innerWidthCm * 0.78 && bucket.length < 4;

    const maxProdHeight = Math.max(...bucket.map((p) => p.heightCm), 10);
    const adaptiveShelfHeightCm = Math.max(10, maxProdHeight + 8);
    nextShelfHeightsCm.push(adaptiveShelfHeightCm);

    const rawWeights = bucket.map((p) => Math.max(10, p.widthCm + 20));
    if (includeSpareEmptyCase) {
      rawWeights.push(Math.max(15, Math.round(innerWidthCm * 0.2)));
    }
    const weightSum = rawWeights.reduce((a, b) => a + b, 0) || 1;

    const createdShelfBins: BinCase[] = rawWeights.map((w, idx) => {
      const colIndex = idx + 1;
      const code = formatBinCode(targetCab.code, s, colIndex);
      const item = bucket[idx];
      let product: ProductItem | null = null;
      if (item) {
        placedCount++;
        product = {
          id: `prod-siemens-${code.toLowerCase()}`,
          reference: item.reference.trim().toUpperCase(),
          name: item.name.trim(),
          category: item.category,
          quantity: item.quantity,
          minThreshold: item.minThreshold,
          maxCapacity: Math.max(item.quantity + 10, 30),
          packagingType: item.packagingType,
          dimensionsCm: {
            lengthCm: item.lengthCm,
            widthCm: item.widthCm,
            heightCm: item.heightCm,
          },
          weightKg: item.weightKg,
          turnoverRate: item.turnoverRate,
          lastUpdated: nowIso,
        };
      }
      return {
        id: `bin-${targetCab.id}-s${s}-c${colIndex}`,
        cabinetId: targetCab.id,
        cabinetCode: targetCab.code,
        shelfIndex: s,
        colIndex,
        code,
        widthRatio: Number((w / weightSum).toFixed(4)),
        maxVolumeCm3: 120000,
        product,
      };
    });

    newBins.push(
      ...normalizeShelfBins(
        targetCab.id,
        targetCab.code,
        s,
        createdShelfBins,
        innerWidthCm,
        adaptiveShelfHeightCm
      )
    );
  }

  const totalHeightMeters = Number(
    (nextShelfHeightsCm.reduce((a, b) => a + b / 100, 0) + 0.2).toFixed(2)
  );

  const updatedCabinets = cabinets.map((c) =>
    c.id === cabinetId
      ? {
          ...c,
          shelfHeightsCm: nextShelfHeightsCm,
          heightMeters: totalHeightMeters,
          bins: newBins,
        }
      : c
  );

  return { updatedCabinets, placedCount };
}

export function getCabinetFootprint(cab: Pick<Cabinet, 'widthMeters' | 'depthMeters' | 'rotationY'>): {
  footprintX: number;
  footprintZ: number;
} {
  const normRot = ((cab.rotationY % 360) + 360) % 360;
  const isRotated90 = normRot === 90 || normRot === 270;
  return {
    footprintX: isRotated90 ? cab.depthMeters : cab.widthMeters,
    footprintZ: isRotated90 ? cab.widthMeters : cab.depthMeters,
  };
}

export function snapToGrid(value: number, step: number = 0.25): number {
  if (step <= 0) return Number(value.toFixed(2));
  return Number((Math.round(value / step) * step).toFixed(2));
}

export function clampCabinetPositionToRoom(
  position: { x: number; z: number },
  cab: Pick<Cabinet, 'widthMeters' | 'depthMeters' | 'rotationY'>,
  room: RoomDimensions
): { x: number; z: number } {
  const { footprintX, footprintZ } = getCabinetFootprint(cab);
  const halfRoomW = room.widthMeters / 2;
  const halfRoomD = room.depthMeters / 2;

  const minX = -halfRoomW + footprintX / 2;
  const maxX = halfRoomW - footprintX / 2;
  const minZ = -halfRoomD + footprintZ / 2;
  const maxZ = halfRoomD - footprintZ / 2;

  return {
    x: minX > maxX ? 0 : Number(Math.max(minX, Math.min(maxX, position.x)).toFixed(2)),
    z: minZ > maxZ ? 0 : Number(Math.max(minZ, Math.min(maxZ, position.z)).toFixed(2)),
  };
}

export function checkCabinetCollision(
  candidate: Pick<Cabinet, 'id' | 'position' | 'widthMeters' | 'depthMeters' | 'rotationY'>,
  others: Cabinet[],
  clearanceMeters: number = 0.02
): string | null {
  const candFp = getCabinetFootprint(candidate);
  const candMinX = candidate.position.x - candFp.footprintX / 2 - clearanceMeters;
  const candMaxX = candidate.position.x + candFp.footprintX / 2 + clearanceMeters;
  const candMinZ = candidate.position.z - candFp.footprintZ / 2 - clearanceMeters;
  const candMaxZ = candidate.position.z + candFp.footprintZ / 2 + clearanceMeters;

  for (const other of others) {
    if (other.id === candidate.id) continue;
    const otherFp = getCabinetFootprint(other);
    const otherMinX = other.position.x - otherFp.footprintX / 2;
    const otherMaxX = other.position.x + otherFp.footprintX / 2;
    const otherMinZ = other.position.z - otherFp.footprintZ / 2;
    const otherMaxZ = other.position.z + otherFp.footprintZ / 2;

    const overlapX = candMinX < otherMaxX && candMaxX > otherMinX;
    const overlapZ = candMinZ < otherMaxZ && candMaxZ > otherMinZ;
    if (overlapX && overlapZ) {
      return other.code;
    }
  }
  return null;
}

export function createCabinet(params: {
  code: string;
  name: string;
  zone: string;
  position: { x: number; z: number };
  rotationY?: number;
  shelvesCount: number;
  columnsCount: number;
  widthMeters?: number;
  depthMeters?: number;
  accentColor?: string;
  shelfCustomRatios?: Record<number, number[]>;
}): Cabinet {
  const cleanCode = params.code.trim().toUpperCase();
  const id = `cab-${cleanCode.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now().toString(36).slice(-4)}`;
  const shelves = Math.max(1, Math.round(params.shelvesCount));
  const cols = Math.max(1, Math.round(params.columnsCount));
  const widthMeters =
    params.widthMeters !== undefined
      ? Number(Math.max(0.05, params.widthMeters).toFixed(2))
      : Number(Math.max(0.05, cols * 0.85 + 0.3).toFixed(2));
  const shelfHeightsCm = Array.from({ length: shelves }, (_, i) =>
    i === 0 ? 52 : i === 1 ? 44 : 38
  );
  const heightMeters = Number(
    Math.max(0.1, shelfHeightsCm.reduce((a, b) => a + b / 100, 0) + 0.2).toFixed(2)
  );
  const depthMeters = Number(Math.max(0.05, params.depthMeters ?? 0.95).toFixed(2));

  return {
    id,
    code: cleanCode,
    name: params.name.trim() || `Armoire ${cleanCode}`,
    zone: params.zone.trim() || 'Zone Siemens Standard',
    position: params.position,
    rotationY: params.rotationY ?? 0,
    shelvesCount: shelves,
    columnsCount: cols,
    shelfHeightsCm,
    widthMeters,
    heightMeters,
    depthMeters,
    accentColor: params.accentColor || '#f59e0b',
    bins: buildEmptyBins(id, cleanCode, shelves, cols, [], params.shelfCustomRatios),
  };
}

/**
 * Creates a Cabinet directly from a drawn 2D rectangle (startX, startZ) -> (endX, endZ)
 * with NO minimum dimension clamp (uses exact drawn width & depth).
 */
export function createCabinetFrom2DRectangle(params: {
  startX: number;
  startZ: number;
  endX: number;
  endZ: number;
  existingCabinetsCount: number;
  shelvesCount?: number;
  accentColor?: string;
  room?: RoomDimensions;
}): Cabinet {
  const rawW = Math.max(0.1, Math.abs(params.endX - params.startX));
  const rawD = Math.max(0.1, Math.abs(params.endZ - params.startZ));
  const centerX = (params.startX + params.endX) / 2;
  const centerZ = (params.startZ + params.endZ) / 2;

  const isVerticalRect = rawD > rawW * 1.25;
  const longSide = Number((isVerticalRect ? rawD : rawW).toFixed(2));
  const shortSide = Number((isVerticalRect ? rawW : rawD).toFixed(2));

  const columnsCount = Math.max(1, Math.round(longSide / 0.85));
  const nextIndex = params.existingCabinetsCount + 1;
  const code = `ARM-S${nextIndex}`;

  const cab = createCabinet({
    code,
    name: `Armoire ${code} — Siemens Stock 2D`,
    zone: centerZ >= 0 ? 'Zone A · Accès Rapide Siemens' : 'Zone B · Réserve Siemens',
    position: {
      x: Number(centerX.toFixed(2)),
      z: Number(centerZ.toFixed(2)),
    },
    rotationY: isVerticalRect ? 90 : 0,
    shelvesCount: params.shelvesCount ?? 4,
    columnsCount,
    widthMeters: longSide,
    depthMeters: shortSide,
    accentColor: params.accentColor || '#f59e0b',
    shelfCustomRatios: {
      1: [0.55, 0.45],
      2: [0.38, 0.34, 0.28],
      3: [0.25, 0.25, 0.25, 0.25],
      4: [0.34, 0.33, 0.33],
    },
  });

  if (params.room) {
    cab.position = clampCabinetPositionToRoom(cab.position, cab, params.room);
  }
  return cab;
}

export function updateCabinetStructure(
  cabinets: Cabinet[],
  cabinetId: string,
  updates: Partial<{
    code: string;
    name: string;
    zone: string;
    position: { x: number; z: number };
    rotationY: number;
    shelvesCount: number;
    columnsCount: number;
    widthMeters: number;
    depthMeters: number;
    accentColor: string;
  }>
): Cabinet[] {
  return cabinets.map((cab) => {
    if (cab.id !== cabinetId) return cab;
    const newCode = updates.code ? updates.code.trim().toUpperCase() : cab.code;
    const newShelves =
      updates.shelvesCount !== undefined
        ? Math.max(1, Math.round(updates.shelvesCount))
        : cab.shelvesCount;
    const newCols =
      updates.columnsCount !== undefined
        ? Math.max(1, Math.round(updates.columnsCount))
        : cab.columnsCount;
    const newDepth =
      updates.depthMeters !== undefined
        ? Number(Math.max(0.05, updates.depthMeters).toFixed(2))
        : cab.depthMeters;

    const widthMeters =
      updates.widthMeters !== undefined
        ? Number(Math.max(0.05, updates.widthMeters).toFixed(2))
        : updates.columnsCount !== undefined
        ? Number(Math.max(0.05, newCols * 0.85 + 0.3).toFixed(2))
        : cab.widthMeters;

    const nextShelfHeightsCm = Array.from({ length: newShelves }, (_, idx) =>
      getShelfHeightCm(cab, idx + 1)
    );
    const heightMeters = Number(
      Math.max(0.1, nextShelfHeightsCm.reduce((a, b) => a + b / 100, 0) + 0.2).toFixed(2)
    );
    const updatedBins = buildEmptyBins(cab.id, newCode, newShelves, newCols, cab.bins);

    return {
      ...cab,
      code: newCode,
      name: updates.name !== undefined ? updates.name : cab.name,
      zone: updates.zone !== undefined ? updates.zone : cab.zone,
      position: updates.position !== undefined ? updates.position : cab.position,
      rotationY: updates.rotationY !== undefined ? updates.rotationY : cab.rotationY,
      shelvesCount: newShelves,
      columnsCount: newCols,
      shelfHeightsCm: nextShelfHeightsCm,
      widthMeters,
      heightMeters,
      depthMeters: newDepth,
      accentColor: updates.accentColor !== undefined ? updates.accentColor : cab.accentColor,
      bins: updatedBins,
    };
  });
}

export function deleteCabinet(cabinets: Cabinet[], cabinetId: string): Cabinet[] {
  return cabinets.filter((c) => c.id !== cabinetId);
}

export function upsertBinProduct(
  cabinets: Cabinet[],
  binId: string,
  productInput: Omit<ProductItem, 'id' | 'lastUpdated'> & { id?: string }
): Cabinet[] {
  const nowIso = new Date().toISOString().split('T')[0];
  return cabinets.map((cab) => {
    if (!cab.bins.some((b) => b.id === binId)) return cab;
    return {
      ...cab,
      bins: cab.bins.map((bin) => {
        if (bin.id !== binId) return bin;
        const product: ProductItem = {
          id: productInput.id || bin.product?.id || `prod-${bin.code.toLowerCase()}`,
          reference: productInput.reference.trim().toUpperCase(),
          name: productInput.name.trim(),
          category: productInput.category,
          quantity: Math.max(0, Math.round(productInput.quantity)),
          minThreshold: Math.max(0, Math.round(productInput.minThreshold)),
          maxCapacity: Math.max(1, Math.round(productInput.maxCapacity)),
          packagingType: productInput.packagingType,
          dimensionsCm: {
            lengthCm: Math.max(0.1, Number(productInput.dimensionsCm.lengthCm)),
            widthCm: Math.max(0.1, Number(productInput.dimensionsCm.widthCm)),
            heightCm: Math.max(0.1, Number(productInput.dimensionsCm.heightCm)),
          },
          weightKg: Math.max(0.01, Number(productInput.weightKg)),
          turnoverRate: Math.max(0.1, Number(productInput.turnoverRate.toFixed(1))),
          lastUpdated: nowIso,
          scannedFromImage: productInput.scannedFromImage ?? bin.product?.scannedFromImage ?? false,
        };
        return {
          ...bin,
          product,
        };
      }),
    };
  });
}

export function removeBinProduct(cabinets: Cabinet[], binId: string): Cabinet[] {
  return cabinets.map((cab) => {
    if (!cab.bins.some((b) => b.id === binId)) return cab;
    return {
      ...cab,
      bins: cab.bins.map((bin) => (bin.id === binId ? { ...bin, product: null } : bin)),
    };
  });
}

export function adjustBinQuantity(cabinets: Cabinet[], binId: string, delta: number): Cabinet[] {
  const nowIso = new Date().toISOString().split('T')[0];
  return cabinets.map((cab) => {
    if (!cab.bins.some((b) => b.id === binId)) return cab;
    return {
      ...cab,
      bins: cab.bins.map((bin) => {
        if (bin.id !== binId || !bin.product) return bin;
        const newQty = Math.max(0, Math.min(bin.product.maxCapacity * 2, bin.product.quantity + delta));
        return {
          ...bin,
          product: {
            ...bin.product,
            quantity: newQty,
            lastUpdated: nowIso,
          },
        };
      }),
    };
  });
}

export function associateScannedItemsToCabinetShelf(
  cabinets: Cabinet[],
  cabinetId: string,
  shelfIndex: number,
  scannedItems: ScannedShelfItem[]
): { updatedCabinets: Cabinet[]; assignedBinCodes: string[] } {
  const assignedBinCodes: string[] = [];
  const nowIso = new Date().toISOString().split('T')[0];

  const updatedCabinets = cabinets.map((cab) => {
    if (cab.id !== cabinetId) return cab;

    const clampedShelf = Math.max(1, Math.min(cab.shelvesCount, shelfIndex));
    const newBins = cab.bins.map((b) => ({ ...b }));
    const shelfBins = newBins
      .filter((b) => b.shelfIndex === clampedShelf)
      .sort((a, b) => a.colIndex - b.colIndex);

    scannedItems.forEach((item, idx) => {
      const desiredCol = Math.max(
        1,
        Math.min(shelfBins.length || 1, item.targetColIndex || idx + 1)
      );
      let targetBin = shelfBins.find((b) => b.colIndex === desiredCol);
      if (!targetBin) {
        targetBin = shelfBins[idx % shelfBins.length];
      }
      if (targetBin) {
        const preset =
          PACKAGING_PRESETS[item.packagingType] || PACKAGING_PRESETS['Carton Standard M'];
        targetBin.product = {
          id: `prod-scan-${targetBin.code.toLowerCase()}-${idx}`,
          reference: item.reference.trim().toUpperCase(),
          name: item.name.trim(),
          category: item.category || 'Électronique',
          quantity: Math.max(1, Math.round(item.quantity)),
          minThreshold: item.minThreshold || 5,
          maxCapacity: Math.max(item.quantity + 10, preset.defaultMaxCap),
          packagingType: item.packagingType in PACKAGING_PRESETS ? item.packagingType : 'Carton Standard M',
          dimensionsCm: {
            lengthCm: item.lengthCm || preset.dimensionsCm.lengthCm,
            widthCm: item.widthCm || preset.dimensionsCm.widthCm,
            heightCm: item.heightCm || preset.dimensionsCm.heightCm,
          },
          weightKg: item.weightKg || 2.0,
          turnoverRate: Number((item.turnoverRate || 14.0).toFixed(1)),
          lastUpdated: nowIso,
          scannedFromImage: true,
        };
        assignedBinCodes.push(targetBin.code);
      }
    });

    return {
      ...cab,
      bins: newBins,
    };
  });

  return { updatedCabinets, assignedBinCodes };
}

export function moveOrSwapBins(
  cabinets: Cabinet[],
  sourceBinId: string,
  targetBinId: string
): Cabinet[] {
  if (sourceBinId === targetBinId) return cabinets;

  let sourceProduct: ProductItem | null = null;
  let targetProduct: ProductItem | null = null;

  for (const cab of cabinets) {
    for (const bin of cab.bins) {
      if (bin.id === sourceBinId) sourceProduct = bin.product ? { ...bin.product } : null;
      if (bin.id === targetBinId) targetProduct = bin.product ? { ...bin.product } : null;
    }
  }

  return cabinets.map((cab) => ({
    ...cab,
    bins: cab.bins.map((bin) => {
      if (bin.id === sourceBinId) {
        return { ...bin, product: targetProduct };
      }
      if (bin.id === targetBinId) {
        return { ...bin, product: sourceProduct };
      }
      return bin;
    }),
  }));
}

export function computeBinAccessCost(cabinet: Cabinet, bin: BinCase): number {
  const entryX = 0;
  const entryZ = 8;
  const horizontalDist = Math.hypot(cabinet.position.x - entryX, cabinet.position.z - entryZ);
  const shelfPenalty = bin.shelfIndex <= 2 ? 0 : (bin.shelfIndex - 2) * 4.5;
  return Number((horizontalDist + shelfPenalty).toFixed(2));
}

export function generateSlottingRecommendations(cabinets: Cabinet[]): SlottingRecommendation[] {
  const allBinsWithContext: Array<{
    cabinet: Cabinet;
    bin: BinCase;
    accessCost: number;
  }> = [];

  for (const cab of cabinets) {
    for (const bin of cab.bins) {
      allBinsWithContext.push({
        cabinet: cab,
        bin,
        accessCost: computeBinAccessCost(cab, bin),
      });
    }
  }

  const suboptimalHighTurnover = allBinsWithContext
    .filter(
      (entry) =>
        entry.bin.product !== null &&
        entry.bin.product.turnoverRate >= 14 &&
        (entry.bin.shelfIndex >= 3 || entry.accessCost > 9.5)
    )
    .sort(
      (a, b) =>
        b.bin.product!.turnoverRate * b.accessCost -
        a.bin.product!.turnoverRate * a.accessCost
    );

  const goldenTargets = allBinsWithContext
    .filter(
      (entry) =>
        entry.bin.shelfIndex <= 2 &&
        entry.accessCost <= 8.5 &&
        (entry.bin.product === null || entry.bin.product.turnoverRate < 7.5)
    )
    .sort((a, b) => a.accessCost - b.accessCost);

  const recommendations: SlottingRecommendation[] = [];
  const usedBinIds = new Set<string>();

  for (const source of suboptimalHighTurnover) {
    if (recommendations.length >= 4) break;
    const prod = source.bin.product!;
    const target = goldenTargets.find(
      (t) =>
        !usedBinIds.has(t.bin.id) &&
        t.bin.id !== source.bin.id &&
        t.accessCost + 2.0 < source.accessCost
    );

    if (target) {
      usedBinIds.add(source.bin.id);
      usedBinIds.add(target.bin.id);

      const timeSavedPct = Math.min(
        48,
        Math.max(18, Math.round((source.accessCost - target.accessCost) * 3.8))
      );
      recommendations.push({
        id: `rec-${source.bin.id}-${target.bin.id}`,
        priority: prod.turnoverRate >= 18 ? 'Haute' : 'Moyenne',
        
         reason:
  source.bin.shelfIndex >= 3
    ? `Référence Classe A (${prod.turnoverRate} rot./an, ${prod.packagingType}) placée en hauteur (Étagère ${source.bin.shelfIndex}). Descendre en zone ergonomique magasinier.`
    : `Forte rotation (${prod.turnoverRate} rot./an) éloignée de l'entrée. Rapprocher vers ${target.cabinet.code}.`,

        impactMetric: `-${timeSavedPct}% temps recherche`,
        sourceBinId: source.bin.id,
        sourceBinCode: source.bin.code,
        sourceProductRef: prod.reference,
        sourceProductName: prod.name,
        sourceTurnover: prod.turnoverRate,
        targetBinId: target.bin.id,
        targetBinCode: target.bin.code,
        targetCurrentProductRef: target.bin.product ? target.bin.product.reference : null,
      });
    }
  }

  return recommendations;
}

export function applySlottingRecommendations(
  cabinets: Cabinet[],
  recommendations: SlottingRecommendation[]
): Cabinet[] {
  let current = cabinets;
  for (const rec of recommendations) {
    current = moveOrSwapBins(current, rec.sourceBinId, rec.targetBinId);
  }
  return current;
}

export function computeWarehouseAnalytics(cabinets: Cabinet[]): AnalyticsSummary {
  let totalBins = 0;
  let occupiedBins = 0;
  let totalUnitsInStock = 0;
  let turnoverSum = 0;
  let lowStockCount = 0;
  let totalPackagingVolumeCm3 = 0;

  let classACount = 0;
  let classBCount = 0;
  let classCCount = 0;

  let ergonomicOptimalCount = 0;
  let highTurnoverTotal = 0;

  const packagingBreakdown: Record<PackagingType, number> = {
    'Bac Europe S': 0,
    'Carton Standard M': 0,
    'Caisse Renforcée L': 0,
    'Coffre Lourd XL': 0,
    'Tube / Rouleau': 0,
  };

  const cabinetMetrics: CabinetAnalytics[] = cabinets.map((cab) => {
    const cabTotal = cab.bins.length;
    let cabOccupied = 0;
    let cabTurnoverSum = 0;
    let cabUnits = 0;

    for (const bin of cab.bins) {
      totalBins++;
      if (bin.product) {
        occupiedBins++;
        cabOccupied++;
        totalUnitsInStock += bin.product.quantity;
        cabUnits += bin.product.quantity;
        turnoverSum += bin.product.turnoverRate;
        cabTurnoverSum += bin.product.turnoverRate;

        if (bin.product.quantity <= bin.product.minThreshold) {
          lowStockCount++;
        }

        const unitVol = calculatePackageVolumeCm3(bin.product.dimensionsCm);
        totalPackagingVolumeCm3 += unitVol * Math.max(1, Math.min(bin.product.quantity, 8));

        const abc = getABCClass(bin.product.turnoverRate);
        if (abc === 'A') {
          classACount++;
          highTurnoverTotal++;
          const cost = computeBinAccessCost(cab, bin);
          if (bin.shelfIndex <= 2 && cost <= 9.0) {
            ergonomicOptimalCount++;
          }
        } else if (abc === 'B') {
          classBCount++;
        } else {
          classCCount++;
        }

        if (bin.product.packagingType in packagingBreakdown) {
          packagingBreakdown[bin.product.packagingType]++;
        }
      }
    }

    return {
      cabinetId: cab.id,
      cabinetCode: cab.code,
      cabinetName: cab.name,
      totalBins: cabTotal,
      occupiedBins: cabOccupied,
      occupancyPercent: cabTotal > 0 ? Math.round((cabOccupied / cabTotal) * 100) : 0,
      avgTurnoverRate: cabOccupied > 0 ? Number((cabTurnoverSum / cabOccupied).toFixed(1)) : 0,
      totalUnits: cabUnits,
    };
  });

  const avgTurnoverRate =
    occupiedBins > 0 ? Number((turnoverSum / occupiedBins).toFixed(1)) : 0;

  const ergonomicSlottingScore =
    highTurnoverTotal > 0
      ? Math.round((ergonomicOptimalCount / highTurnoverTotal) * 100)
      : 100;

  return {
    totalCabinets: cabinets.length,
    totalBins,
    occupiedBins,
    occupancyPercent: totalBins > 0 ? Math.round((occupiedBins / totalBins) * 100) : 0,
    totalDistinctProducts: occupiedBins,
    totalUnitsInStock,
    avgTurnoverRate,
    lowStockCount,
    totalPackagingVolumeM3: Number((totalPackagingVolumeCm3 / 1_000_000).toFixed(2)),
    ergonomicSlottingScore,
    abcDistribution: {
      classA: {
        count: classACount,
        percent: occupiedBins > 0 ? Math.round((classACount / occupiedBins) * 100) : 0,
        label: 'Classe A · Haute rotation (≥14/an)',
      },
      classB: {
        count: classBCount,
        percent: occupiedBins > 0 ? Math.round((classBCount / occupiedBins) * 100) : 0,
        label: 'Classe B · Rotation régulière (7–14/an)',
      },
      classC: {
        count: classCCount,
        percent: occupiedBins > 0 ? Math.round((classCCount / occupiedBins) * 100) : 0,
        label: 'Classe C · Faible rotation (<7/an)',
      },
    },
    packagingBreakdown,
    cabinetMetrics,
  };
}

export function searchWarehouseBins(
  cabinets: Cabinet[],
  query: string,
  categoryFilter: string = 'ALL',
  packagingFilter: string = 'ALL'
): BinCase[] {
  const q = query.trim().toLowerCase();
  const results: BinCase[] = [];

  for (const cab of cabinets) {
    for (const bin of cab.bins) {
      if (!bin.product) continue;
      const p = bin.product;

      if (categoryFilter !== 'ALL' && p.category !== categoryFilter) continue;
      if (packagingFilter !== 'ALL' && p.packagingType !== packagingFilter) continue;

      if (
        !q ||
        p.reference.toLowerCase().includes(q) ||
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.packagingType.toLowerCase().includes(q) ||
        bin.code.toLowerCase().includes(q) ||
        cab.code.toLowerCase().includes(q)
      ) {
        results.push(bin);
      }
    }
  }

  return results;
}

export function createInitialWarehouseCabinets(): Cabinet[] {
  const cabDefinitions: Array<{
    id: string;
    code: string;
    name: string;
    zone: string;
    position: { x: number; z: number };
    rotationY: number;
    shelvesCount: number;
    columnsCount: number;
    shelfHeightsCm: number[];
    shelfCustomRatios: Record<number, number[]>;
    accentColor: string;
    seededBins: Array<{
      shelf: number;
      col: number;
      product: Omit<ProductItem, 'id' | 'lastUpdated'>;
    }>;
  }> = [
    {
      id: 'cab-arm-a1',
      code: 'ARM-A1',
      name: 'Armoire A1 — Électronique & Automates',
      zone: 'Zone A · Accès Direct',
      position: { x: -4.2, z: 2.5 },
      rotationY: 0,
      shelvesCount: 4,
      columnsCount: 4,
      shelfHeightsCm: [56, 44, 38, 36],
      shelfCustomRatios: {
        1: [0.55, 0.45],
        2: [0.42, 0.33, 0.25],
        3: [0.28, 0.27, 0.23, 0.22],
        4: [0.22, 0.22, 0.2, 0.18, 0.18],
      },
      accentColor: '#f59e0b',
      seededBins: [
        {
          shelf: 1,
          col: 1,
          product: {
            reference: 'SKU-DRV-750',
            name: 'Variateur Industriel 7.5kW IP20',
            category: 'Mécanique',
            quantity: 6,
            minThreshold: 2,
            maxCapacity: 10,
            packagingType: 'Coffre Lourd XL',
            dimensionsCm: { lengthCm: 62, widthCm: 48, heightCm: 38 },
            weightKg: 16.4,
            turnoverRate: 14.5,
          },
        },
        {
          shelf: 1,
          col: 2,
          product: {
            reference: 'SKU-PLC-150',
            name: 'Coffret Automate Modulaire Ethernet',
            category: 'Électronique',
            quantity: 9,
            minThreshold: 3,
            maxCapacity: 18,
            packagingType: 'Caisse Renforcée L',
            dimensionsCm: { lengthCm: 50, widthCm: 36, heightCm: 28 },
            weightKg: 5.8,
            turnoverRate: 18.2,
          },
        },
        {
          shelf: 2,
          col: 1,
          product: {
            reference: 'SKU-CPU-110',
            name: 'Unité Centrale Automate Standard',
            category: 'Électronique',
            quantity: 18,
            minThreshold: 5,
            maxCapacity: 30,
            packagingType: 'Carton Standard M',
            dimensionsCm: { lengthCm: 38, widthCm: 30, heightCm: 22 },
            weightKg: 1.9,
            turnoverRate: 23.4,
          },
        },
        {
          shelf: 2,
          col: 2,
          product: {
            reference: 'SKU-CPU-120',
            name: 'Contrôleur Compact 24V DC',
            category: 'Électronique',
            quantity: 32,
            minThreshold: 8,
            maxCapacity: 45,
            packagingType: 'Carton Standard M',
            dimensionsCm: { lengthCm: 34, widthCm: 26, heightCm: 18 },
            weightKg: 1.2,
            turnoverRate: 25.0,
          },
        },
        {
          shelf: 2,
          col: 3,
          product: {
            reference: 'SKU-MEM-004',
            name: 'Carte Mémoire Industrielle 4 Mo',
            category: 'Électronique',
            quantity: 8,
            minThreshold: 3,
            maxCapacity: 40,
            packagingType: 'Bac Europe S',
            dimensionsCm: { lengthCm: 24, widthCm: 18, heightCm: 12 },
            weightKg: 0.4,
            turnoverRate: 3.1,
          },
        },
        {
          shelf: 3,
          col: 1,
          product: {
            reference: 'SKU-CPL-010',
            name: 'Coupleur Bus de Terrain Ethernet',
            category: 'Électronique',
            quantity: 36,
            minThreshold: 10,
            maxCapacity: 50,
            packagingType: 'Bac Europe S',
            dimensionsCm: { lengthCm: 28, widthCm: 20, heightCm: 15 },
            weightKg: 0.9,
            turnoverRate: 21.8,
          },
        },
        {
          shelf: 3,
          col: 3,
          product: {
            reference: 'SKU-MOD-008',
            name: 'Module 8 Entrées Digitales 24V',
            category: 'Électronique',
            quantity: 4,
            minThreshold: 8,
            maxCapacity: 50,
            packagingType: 'Bac Europe S',
            dimensionsCm: { lengthCm: 26, widthCm: 18, heightCm: 14 },
            weightKg: 0.6,
            turnoverRate: 19.6,
          },
        },
        {
          shelf: 4,
          col: 2,
          product: {
            reference: 'SKU-CNT-025',
            name: 'Contacteur Puissance 25A Bobine 24V',
            category: 'Électronique',
            quantity: 44,
            minThreshold: 12,
            maxCapacity: 50,
            packagingType: 'Bac Europe S',
            dimensionsCm: { lengthCm: 24, widthCm: 16, heightCm: 14 },
            weightKg: 1.4,
            turnoverRate: 24.2,
          },
        },
      ],
    },
    {
      id: 'cab-arm-a2',
      code: 'ARM-A2',
      name: 'Armoire A2 — Variateurs & Écrans IHM',
      zone: 'Zone A · Accès Direct',
      position: { x: 4.2, z: 2.5 },
      rotationY: 0,
      shelvesCount: 4,
      columnsCount: 4,
      shelfHeightsCm: [58, 44, 38, 36],
      shelfCustomRatios: {
        1: [0.5, 0.5],
        2: [0.38, 0.32, 0.3],
        3: [0.25, 0.25, 0.25, 0.25],
        4: [0.34, 0.33, 0.33],
      },
      accentColor: '#06b6d4',
      seededBins: [
        {
          shelf: 1,
          col: 1,
          product: {
            reference: 'SKU-DRV-150',
            name: 'Variateur de Fréquence 1.5kW Modulaire',
            category: 'Électronique',
            quantity: 12,
            minThreshold: 4,
            maxCapacity: 18,
            packagingType: 'Caisse Renforcée L',
            dimensionsCm: { lengthCm: 48, widthCm: 36, heightCm: 28 },
            weightKg: 6.8,
            turnoverRate: 18.9,
          },
        },
        {
          shelf: 1,
          col: 2,
          product: {
            reference: 'SKU-DRV-075',
            name: 'Variateur Vitesse Basique 0.75kW',
            category: 'Électronique',
            quantity: 7,
            minThreshold: 2,
            maxCapacity: 20,
            packagingType: 'Carton Standard M',
            dimensionsCm: { lengthCm: 38, widthCm: 28, heightCm: 22 },
            weightKg: 3.1,
            turnoverRate: 2.8,
          },
        },
        {
          shelf: 2,
          col: 1,
          product: {
            reference: 'SKU-IHM-120',
            name: 'Pupitre Écran Tactile 12 pouces',
            category: 'Électronique',
            quantity: 9,
            minThreshold: 3,
            maxCapacity: 18,
            packagingType: 'Caisse Renforcée L',
            dimensionsCm: { lengthCm: 52, widthCm: 38, heightCm: 26 },
            weightKg: 5.2,
            turnoverRate: 15.6,
          },
        },
        {
          shelf: 3,
          col: 4,
          product: {
            reference: 'SKU-IHM-070',
            name: 'Écran Tactile Opérateur 7 pouces',
            category: 'Électronique',
            quantity: 21,
            minThreshold: 6,
            maxCapacity: 35,
            packagingType: 'Carton Standard M',
            dimensionsCm: { lengthCm: 36, widthCm: 28, heightCm: 20 },
            weightKg: 2.2,
            turnoverRate: 17.8,
          },
        },
        {
          shelf: 4,
          col: 1,
          product: {
            reference: 'SKU-ALM-024',
            name: 'Alimentation Industrielle 24V/10A',
            category: 'Électronique',
            quantity: 3,
            minThreshold: 6,
            maxCapacity: 30,
            packagingType: 'Carton Standard M',
            dimensionsCm: { lengthCm: 34, widthCm: 26, heightCm: 20 },
            weightKg: 2.4,
            turnoverRate: 20.4,
          },
        },
      ],
    },
    {
      id: 'cab-arm-b1',
      code: 'ARM-B1',
      name: 'Armoire B1 — Appareillage & Protection Électrique',
      zone: 'Zone B · Allée Centrale',
      position: { x: -4.2, z: -3.2 },
      rotationY: 0,
      shelvesCount: 4,
      columnsCount: 4,
      shelfHeightsCm: [54, 44, 38, 36],
      shelfCustomRatios: {
        1: [0.55, 0.45],
        2: [0.34, 0.33, 0.33],
        3: [0.22, 0.22, 0.2, 0.18, 0.18],
        4: [0.25, 0.25, 0.25, 0.25],
      },
      accentColor: '#10b981',
      seededBins: [
        {
          shelf: 1,
          col: 1,
          product: {
            reference: 'SKU-DIS-160',
            name: 'Disjoncteur Boîtier Moulé 160A',
            category: 'Électronique',
            quantity: 7,
            minThreshold: 3,
            maxCapacity: 12,
            packagingType: 'Coffre Lourd XL',
            dimensionsCm: { lengthCm: 58, widthCm: 42, heightCm: 34 },
            weightKg: 12.6,
            turnoverRate: 11.4,
          },
        },
        {
          shelf: 2,
          col: 2,
          product: {
            reference: 'SKU-CAB-100',
            name: 'Touret Câble Ethernet Industriel Blindé',
            category: 'Maintenance',
            quantity: 14,
            minThreshold: 5,
            maxCapacity: 25,
            packagingType: 'Tube / Rouleau',
            dimensionsCm: { lengthCm: 55, widthCm: 16, heightCm: 16 },
            weightKg: 4.8,
            turnoverRate: 10.2,
          },
        },
        {
          shelf: 3,
          col: 1,
          product: {
            reference: 'SKU-DIS-016',
            name: 'Disjoncteur Moteur Calibre 11-16A',
            category: 'Électronique',
            quantity: 42,
            minThreshold: 12,
            maxCapacity: 50,
            packagingType: 'Bac Europe S',
            dimensionsCm: { lengthCm: 24, widthCm: 16, heightCm: 14 },
            weightKg: 1.1,
            turnoverRate: 23.4,
          },
        },
        {
          shelf: 4,
          col: 3,
          product: {
            reference: 'SKU-MOD-016',
            name: 'Disjoncteur Modulaire 2P 16A Courbe C',
            category: 'Maintenance',
            quantity: 29,
            minThreshold: 8,
            maxCapacity: 40,
            packagingType: 'Carton Standard M',
            dimensionsCm: { lengthCm: 36, widthCm: 28, heightCm: 20 },
            weightKg: 1.6,
            turnoverRate: 16.5,
          },
        },
      ],
    },
    {
      id: 'cab-arm-b2',
      code: 'ARM-B2',
      name: 'Armoire B2 — Réseau & Connectique Industrielle',
      zone: 'Zone B · Allée Centrale',
      position: { x: 4.2, z: -3.2 },
      rotationY: 0,
      shelvesCount: 4,
      columnsCount: 4,
      shelfHeightsCm: [52, 44, 38, 36],
      shelfCustomRatios: {
        1: [0.5, 0.5],
        2: [0.4, 0.35, 0.25],
        3: [0.25, 0.25, 0.25, 0.25],
        4: [0.34, 0.33, 0.33],
      },
      accentColor: '#6366f1',
      seededBins: [
        {
          shelf: 1,
          col: 2,
          product: {
            reference: 'SKU-SWT-008',
            name: 'Switch Industriel 8 Ports Gigabit',
            category: 'Électronique',
            quantity: 19,
            minThreshold: 6,
            maxCapacity: 35,
            packagingType: 'Carton Standard M',
            dimensionsCm: { lengthCm: 34, widthCm: 26, heightCm: 18 },
            weightKg: 1.8,
            turnoverRate: 15.2,
          },
        },
        {
          shelf: 2,
          col: 1,
          product: {
            reference: 'SKU-RJ4-050',
            name: 'Connecteurs RJ45 Métalliques (Lot x50)',
            category: 'Fixation',
            quantity: 26,
            minThreshold: 8,
            maxCapacity: 45,
            packagingType: 'Bac Europe S',
            dimensionsCm: { lengthCm: 30, widthCm: 20, heightCm: 15 },
            weightKg: 2.1,
            turnoverRate: 13.8,
          },
        },
        {
          shelf: 3,
          col: 3,
          product: {
            reference: 'SKU-BOR-020',
            name: 'Bornier Connecteur Frontal 20 Points',
            category: 'Fixation',
            quantity: 14,
            minThreshold: 6,
            maxCapacity: 30,
            packagingType: 'Carton Standard M',
            dimensionsCm: { lengthCm: 36, widthCm: 26, heightCm: 20 },
            weightKg: 1.9,
            turnoverRate: 6.1,
          },
        },
      ],
    },
    {
      id: 'cab-arm-c1',
      code: 'ARM-C1',
      name: 'Armoire C1 — Moteurs & Charges Lourdes',
      zone: 'Zone C · Fond Salle',
      position: { x: 0, z: -6.5 },
      rotationY: 0,
      shelvesCount: 3,
      columnsCount: 5,
      shelfHeightsCm: [62, 48, 40],
      shelfCustomRatios: {
        1: [0.4, 0.35, 0.25],
        2: [0.35, 0.35, 0.3],
        3: [0.2, 0.2, 0.2, 0.2, 0.2],
      },
      accentColor: '#ec4899',
      seededBins: [
        {
          shelf: 1,
          col: 1,
          product: {
            reference: 'SKU-MOT-100',
            name: 'Servomoteur Brushless 1.0kW',
            category: 'Mécanique',
            quantity: 5,
            minThreshold: 2,
            maxCapacity: 10,
            packagingType: 'Coffre Lourd XL',
            dimensionsCm: { lengthCm: 58, widthCm: 44, heightCm: 36 },
            weightKg: 14.8,
            turnoverRate: 8.4,
          },
        },
        {
          shelf: 2,
          col: 2,
          product: {
            reference: 'SKU-MOT-400',
            name: 'Moteur Asynchrone Triphasé 4kW 1500 tr/min',
            category: 'Mécanique',
            quantity: 4,
            minThreshold: 2,
            maxCapacity: 8,
            packagingType: 'Coffre Lourd XL',
            dimensionsCm: { lengthCm: 64, widthCm: 46, heightCm: 38 },
            weightKg: 26.0,
            turnoverRate: 5.2,
          },
        },
        {
          shelf: 3,
          col: 5,
          product: {
            reference: 'SKU-ENC-001',
            name: 'Codeur Rotatif Optique Absolu',
            category: 'Électronique',
            quantity: 38,
            minThreshold: 10,
            maxCapacity: 50,
            packagingType: 'Bac Europe S',
            dimensionsCm: { lengthCm: 28, widthCm: 18, heightCm: 14 },
            weightKg: 0.9,
            turnoverRate: 22.8,
          },
        },
      ],
    },
  ];

  const nowIso = '2026-10-29';

  return cabDefinitions.map((def) => {
    const widthMeters = Number((def.columnsCount * 0.85 + 0.3).toFixed(2));
    const heightMeters = Number(
      (def.shelfHeightsCm.reduce((a, b) => a + b / 100, 0) + 0.35).toFixed(2)
    );
    const depthMeters = 0.95;
    const bins = buildEmptyBins(
      def.id,
      def.code,
      def.shelvesCount,
      def.columnsCount,
      [],
      def.shelfCustomRatios
    );

    for (const seed of def.seededBins) {
      const target = bins.find((b) => b.shelfIndex === seed.shelf && b.colIndex === seed.col);
      if (target) {
        target.product = {
          ...seed.product,
          id: `prod-${target.code.toLowerCase()}`,
          lastUpdated: nowIso,
        };
      }
    }

    return {
      id: def.id,
      code: def.code,
      name: def.name,
      zone: def.zone,
      position: def.position,
      rotationY: def.rotationY,
      shelvesCount: def.shelvesCount,
      columnsCount: def.columnsCount,
      shelfHeightsCm: def.shelfHeightsCm,
      widthMeters,
      heightMeters,
      depthMeters,
      accentColor: def.accentColor,
      bins,
    };
  });
}
