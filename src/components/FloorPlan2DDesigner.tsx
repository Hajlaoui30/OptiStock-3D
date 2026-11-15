import React, { useState, useRef } from 'react';
import {
  Move,
  SquarePlus,
  RotateCw,
  Trash2,
  Plus,
  Minus,
  Layers,
  GripVertical,
  AlertTriangle,
  Check,
  Edit3,
  ScanLine,
  Maximize2,
  FileSpreadsheet,
  Upload,
  Download,
  Sparkles,
  SlidersHorizontal,
} from 'lucide-react';
import {
  Cabinet,
  RoomDimensions,
  ProductItem,
  SiemensExcelProductRow,
  DEFAULT_SIEMENS_EXCEL_CATALOG,
  getCabinetFootprint,
  snapToGrid,
  clampCabinetPositionToRoom,
  checkCabinetCollision,
  createCabinet,
  createCabinetFrom2DRectangle,
  getShelfBinsWithGeometry,
  getShelfHeightCm,
} from '../utils/warehouseLogic';
import {
  parseSiemensExcelBuffer,
  downloadSiemensExcelTemplate,
} from '../utils/siemensExcelParser';

interface FloorPlan2DDesignerProps {
  cabinets: Cabinet[];
  roomDimensions: RoomDimensions;
  selectedCabinetId: string | null;
  selectedBinId: string | null;
  onUpdateRoomDimensions: (updates: Partial<RoomDimensions>) => void;
  onSelectCabinet: (cabinetId: string) => void;
  onSelectBin: (cabinetId: string, binId: string) => void;
  onAddCabinet: (cab: Cabinet) => void;
  onUpdateCabinet: (
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
  ) => void;
  onDeleteCabinet: (cabinetId: string) => void;
  onAddBinToShelf: (cabinetId: string, shelfIndex: number) => void;
  onRemoveBinFromShelf: (
    cabinetId: string,
    shelfIndex: number,
    binId?: string
  ) => void;
  onResizeShelfDivider: (
    cabinetId: string,
    shelfIndex: number,
    leftColIndex: number,
    deltaRatio: number
  ) => void;
  onSetBinWidthCm: (binId: string, targetWidthCm: number) => void;
  onApplyShelfPreset: (
    cabinetId: string,
    shelfIndex: number,
    ratios: number[]
  ) => void;
  onUpdateShelfHeightCm: (
    cabinetId: string,
    shelfIndex: number,
    heightCm: number
  ) => void;
  onAutoOrganizeSiemensCabinet: (
    cabinetId: string,
    products: SiemensExcelProductRow[]
  ) => void;
  onSwapBins: (sourceBinId: string, targetBinId: string) => void;
  onUpsertBinProduct: (
    binId: string,
    productInput: Omit<ProductItem, 'id' | 'lastUpdated'>
  ) => void;
  onOpenDetailedInspector: () => void;
  onOpenAIScanner: (cabinetId: string, shelfIndex: number) => void;
  onSwitchTo3D: () => void;
}

interface CabinetPresetTemplate {
  id: string;
  label: string;
  subtitle: string;
  shelvesCount: number;
  columnsCount: number;
  widthMeters: number;
  depthMeters: number;
  accentColor: string;
  shelfCustomRatios: Record<number, number[]>;
}

const CABINET_TEMPLATES: CabinetPresetTemplate[] = [
  {
    id: 'tpl-asym-4',
    label: 'Armoire Modulaire Asymétrique (2/3/4/5 Cases)',
    subtitle: '3.70m × 0.95m · Cases Inégales E1(2), E2(3), E3(4), E4(5)',
    shelvesCount: 4,
    columnsCount: 4,
    widthMeters: 3.7,
    depthMeters: 0.95,
    accentColor: '#f59e0b',
    shelfCustomRatios: {
      1: [0.55, 0.45],
      2: [0.42, 0.33, 0.25],
      3: [0.28, 0.27, 0.23, 0.22],
      4: [0.22, 0.22, 0.2, 0.18, 0.18],
    },
  },
  {
    id: 'tpl-drives-3',
    label: 'Rack Variateurs & Moteurs Lourds',
    subtitle: '4.55m × 1.10m · E1 Large (2 coffres), E2 (3), E3 (4)',
    shelvesCount: 3,
    columnsCount: 5,
    widthMeters: 4.55,
    depthMeters: 1.1,
    accentColor: '#06b6d4',
    shelfCustomRatios: {
      1: [0.52, 0.48],
      2: [0.38, 0.34, 0.28],
      3: [0.25, 0.25, 0.25, 0.25],
    },
  },
  {
    id: 'tpl-electric-4',
    label: 'Armoire Appareillage Électrique & Fournitures',
    subtitle: '2.00m × 0.60m · Dimensions Libres Sur Mesure',
    shelvesCount: 4,
    columnsCount: 3,
    widthMeters: 2.0,
    depthMeters: 0.6,
    accentColor: '#10b981',
    shelfCustomRatios: {
      1: [0.5, 0.5],
      2: [0.35, 0.35, 0.3],
      3: [0.2, 0.2, 0.2, 0.2, 0.2],
      4: [0.25, 0.25, 0.25, 0.25],
    },
  },
];

export const FloorPlan2DDesigner: React.FC<FloorPlan2DDesignerProps> = ({
  cabinets,
  roomDimensions,
  selectedCabinetId,
  selectedBinId,
  onUpdateRoomDimensions,
  onSelectCabinet,
  onSelectBin,
  onAddCabinet,
  onUpdateCabinet,
  onDeleteCabinet,
  onAddBinToShelf,
  onRemoveBinFromShelf,
  onResizeShelfDivider,
  onSetBinWidthCm,
  onApplyShelfPreset,
  onUpdateShelfHeightCm,
  onAutoOrganizeSiemensCabinet,
  onSwapBins,
  onUpsertBinProduct,
  onOpenDetailedInspector,
  onOpenAIScanner,
  onSwitchTo3D,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const excelInputRef = useRef<HTMLInputElement | null>(null);

  const [toolMode, setToolMode] = useState<'move' | 'draw-rect'>('move');
  const [statusFeedback, setStatusFeedback] = useState<string>(
    'Dimensions libres sans minimum : configurez la salle, les armoires et chaque case sur mesure en 2D puis visualisez en 3D.'
  );

  // Imported / Active Siemens Excel product list
  const [siemensProducts, setSiemensProducts] = useState<SiemensExcelProductRow[]>(
    DEFAULT_SIEMENS_EXCEL_CATALOG
  );
  const [importedFileName, setImportedFileName] = useState<string>(
    'Catalogue_General_Articles.xlsx (12 réf.)'
  );
  const [autoAdaptCaseOnDrop, setAutoAdaptCaseOnDrop] = useState<boolean>(true);

  // Pointer drag state on the 2D SVG Floor Plan
  const [dragState, setDragState] = useState<
    | null
    | {
        type: 'move-cabinet';
        cabinetId: string;
        offsetX: number;
        offsetZ: number;
      }
    | {
        type: 'resize-cabinet-width';
        cabinetId: string;
      }
    | {
        type: 'resize-cabinet-depth';
        cabinetId: string;
      }
    | {
        type: 'draw-new-rect';
        startX: number;
        startZ: number;
        currentX: number;
        currentZ: number;
      }
    | {
        type: 'resize-room-width';
      }
    | {
        type: 'resize-room-depth';
      }
  >(null);

  // Pointer drag state for resizing unequal case vertical dividers in the 2D Elevation View
  const [dividerDrag, setDividerDrag] = useState<null | {
    cabinetId: string;
    shelfIndex: number;
    leftColIndex: number;
    startClientX: number;
    rowPixelWidth: number;
  }>(null);

  // HTML5 Drag & Drop state for Bins and Siemens Excel Products
  const [draggedBinId, setDraggedBinId] = useState<string | null>(null);
  const [draggedSiemensRow, setDraggedSiemensRow] =
    useState<SiemensExcelProductRow | null>(null);
  const [dragOverBinId, setDragOverBinId] = useState<string | null>(null);

  const selectedCabinet =
    cabinets.find((c) => c.id === selectedCabinetId) || cabinets[0] || null;

  const selectedBin =
    selectedCabinet?.bins.find((b) => b.id === selectedBinId) ||
    selectedCabinet?.bins[0] ||
    null;

  const selectedBinGeometry =
    selectedCabinet && selectedBin
      ? getShelfBinsWithGeometry(selectedCabinet, selectedBin.shelfIndex).find(
          (g) => g.bin.id === selectedBin.id
        ) || null
      : null;

  // Handle Excel / CSV upload (.xlsx, .xls, .csv)
  const handleExcelFileUpload = async (file: File) => {
    try {
      const buffer = await file.arrayBuffer();
      const rows = parseSiemensExcelBuffer(buffer);
      if (rows.length > 0) {
        setSiemensProducts(rows);
        setImportedFileName(`${file.name} (${rows.length} réf. Siemens)`);
        setStatusFeedback(
          `Fichier Excel "${file.name}" importé : ${rows.length} références Siemens avec dimensions chargées.`
        );
      } else {
        setStatusFeedback(
          `Aucune ligne valide trouvée dans "${file.name}". Vérifiez les colonnes Référence, Désignation, Longueur_cm, Largeur_cm, Hauteur_cm.`
        );
      }
    } catch {
      setStatusFeedback(
        `Erreur lors de la lecture du fichier Excel "${file.name}".`
      );
    }
  };

  // Convert client mouse coordinates to world (X, Z) meters on the 2D Floor Plan
  const clientToWorldXZ = (
    clientX: number,
    clientY: number
  ): { x: number; z: number } => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, z: 0 };
    const rect = svg.getBoundingClientRect();
    const pad = Math.max(2, Math.min(roomDimensions.widthMeters, roomDimensions.depthMeters) * 0.28);
    const viewW = roomDimensions.widthMeters + pad * 2;
    const viewD = roomDimensions.depthMeters + pad * 2;
    const normX = (clientX - rect.left) / rect.width;
    const normY = (clientY - rect.top) / rect.height;
    const worldX = (normX - 0.5) * viewW;
    const worldZ = (normY - 0.5) * viewD;
    return {
      x: snapToGrid(worldX, roomDimensions.gridStepMeters),
      z: snapToGrid(worldZ, roomDimensions.gridStepMeters),
    };
  };

  const handleSvgPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (
      e.target !== svgRef.current &&
      (e.target as Element).getAttribute('data-floor-bg') !== 'true'
    ) {
      return;
    }
    if (toolMode === 'draw-rect') {
      const pt = clientToWorldXZ(e.clientX, e.clientY);
      setDragState({
        type: 'draw-new-rect',
        startX: pt.x,
        startZ: pt.z,
        currentX: pt.x + 1.0,
        currentZ: pt.z + 0.6,
      });
      (e.currentTarget as Element).setPointerCapture(e.pointerId);
    }
  };

  const handleSvgPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!dragState) return;
    const pt = clientToWorldXZ(e.clientX, e.clientY);

    if (dragState.type === 'move-cabinet') {
      const cab = cabinets.find((c) => c.id === dragState.cabinetId);
      if (!cab) return;
      const rawPos = {
        x: snapToGrid(pt.x - dragState.offsetX, roomDimensions.gridStepMeters),
        z: snapToGrid(pt.z - dragState.offsetZ, roomDimensions.gridStepMeters),
      };
      const clamped = clampCabinetPositionToRoom(rawPos, cab, roomDimensions);
      onUpdateCabinet(cab.id, { position: clamped });
    } else if (dragState.type === 'resize-cabinet-width') {
      const cab = cabinets.find((c) => c.id === dragState.cabinetId);
      if (!cab) return;
      const isRotated90 = cab.rotationY === 90 || cab.rotationY === 270;
      const deltaMeters = isRotated90
        ? Math.abs(pt.z - cab.position.z) * 2
        : Math.abs(pt.x - cab.position.x) * 2;
      const newWidth = Number(Math.max(0.05, deltaMeters).toFixed(2));
      onUpdateCabinet(cab.id, { widthMeters: newWidth });
    } else if (dragState.type === 'resize-cabinet-depth') {
      const cab = cabinets.find((c) => c.id === dragState.cabinetId);
      if (!cab) return;
      const isRotated90 = cab.rotationY === 90 || cab.rotationY === 270;
      const deltaDepth = isRotated90
        ? Math.abs(pt.x - cab.position.x) * 2
        : Math.abs(pt.z - cab.position.z) * 2;
      const newDepth = Number(Math.max(0.05, deltaDepth).toFixed(2));
      onUpdateCabinet(cab.id, { depthMeters: newDepth });
    } else if (dragState.type === 'draw-new-rect') {
      setDragState({
        ...dragState,
        currentX: pt.x,
        currentZ: pt.z,
      });
    } else if (dragState.type === 'resize-room-width') {
      const newWidth = Number(Math.max(0.5, Math.abs(pt.x) * 2).toFixed(1));
      onUpdateRoomDimensions({ widthMeters: newWidth });
    } else if (dragState.type === 'resize-room-depth') {
      const newDepth = Number(Math.max(0.5, Math.abs(pt.z) * 2).toFixed(1));
      onUpdateRoomDimensions({ depthMeters: newDepth });
    }
  };

  const handleSvgPointerUp = () => {
    if (!dragState) return;

    if (dragState.type === 'draw-new-rect') {
      const newCab = createCabinetFrom2DRectangle({
        startX: dragState.startX,
        startZ: dragState.startZ,
        endX: dragState.currentX,
        endZ: dragState.currentZ,
        existingCabinetsCount: cabinets.length,
        room: roomDimensions,
      });
      onAddCabinet(newCab);
      onSelectCabinet(newCab.id);
      setToolMode('move');
      setStatusFeedback(
        `Armoire ${newCab.code} (${newCab.widthMeters}m × ${newCab.depthMeters}m) créée aux dimensions exactes.`
      );
    }
    setDragState(null);
  };

  const handleDropTemplateOnFloorPlan = (
    e: React.DragEvent<SVGSVGElement>
  ) => {
    e.preventDefault();
    const tplId = e.dataTransfer.getData('application/x-optistock-cabinet-tpl');
    if (!tplId) return;
    const tpl = CABINET_TEMPLATES.find((t) => t.id === tplId);
    if (!tpl) return;

    const pt = clientToWorldXZ(e.clientX, e.clientY);
    const code = `ARM-S${cabinets.length + 1}`;
    const newCab = createCabinet({
      code,
      name: `Armoire ${code} — ${tpl.label}`,
      zone:
        pt.z >= 0
          ? 'Zone A · Accès Direct '
          : 'Zone B · Réserve ',
      position: pt,
      rotationY: 0,
      shelvesCount: tpl.shelvesCount,
      columnsCount: tpl.columnsCount,
      widthMeters: tpl.widthMeters,
      depthMeters: tpl.depthMeters,
      accentColor: tpl.accentColor,
      shelfCustomRatios: tpl.shelfCustomRatios,
    });
    newCab.position = clampCabinetPositionToRoom(
      newCab.position,
      newCab,
      roomDimensions
    );
    onAddCabinet(newCab);
    onSelectCabinet(newCab.id);
    setStatusFeedback(
      `${newCab.code} déposée en (${newCab.position.x}m, ${newCab.position.z}m) avec étagères à cases inégales.`
    );
  };

  const handleQuickInsertTemplate = (tpl: CabinetPresetTemplate) => {
    const code = `ARM-S${cabinets.length + 1}`;
    const candidatePositions = [
      { x: 0, z: 2.5 },
      { x: 0, z: -3.2 },
      { x: -6.2, z: 0 },
      { x: 6.2, z: 0 },
      { x: -4.5, z: -5.5 },
      { x: 4.5, z: -5.5 },
    ];
    const chosenPos =
      candidatePositions[cabinets.length % candidatePositions.length];

    const newCab = createCabinet({
      code,
      name: `Armoire ${code} — ${tpl.label}`,
      zone: 'Zone A · Accès Direct Siemens',
      position: chosenPos,
      rotationY: 0,
      shelvesCount: tpl.shelvesCount,
      columnsCount: tpl.columnsCount,
      widthMeters: tpl.widthMeters,
      depthMeters: tpl.depthMeters,
      accentColor: tpl.accentColor,
      shelfCustomRatios: tpl.shelfCustomRatios,
    });
    newCab.position = clampCabinetPositionToRoom(
      newCab.position,
      newCab,
      roomDimensions
    );
    onAddCabinet(newCab);
    onSelectCabinet(newCab.id);
    setStatusFeedback(
      `Armoire ${newCab.code} insérée sur le plan 2D avec découpage de cases inégales.`
    );
  };

  // Handle dropping either another bin or an imported Siemens Excel product onto a target 2D case
  const handleDropOnBin = (targetBinId: string, targetBinCode: string) => {
    if (draggedBinId && draggedBinId !== targetBinId) {
      onSwapBins(draggedBinId, targetBinId);
      setStatusFeedback(
        `Produits permutés par Drag & Drop vers la case ${targetBinCode}.`
      );
    } else if (draggedSiemensRow) {
      onUpsertBinProduct(targetBinId, {
        reference: draggedSiemensRow.reference,
        name: draggedSiemensRow.name,
        category: draggedSiemensRow.category,
        packagingType: draggedSiemensRow.packagingType,
        dimensionsCm: {
          lengthCm: draggedSiemensRow.lengthCm,
          widthCm: draggedSiemensRow.widthCm,
          heightCm: draggedSiemensRow.heightCm,
        },
        weightKg: draggedSiemensRow.weightKg,
        quantity: draggedSiemensRow.quantity,
        minThreshold: draggedSiemensRow.minThreshold,
        maxCapacity: Math.max(draggedSiemensRow.quantity + 12, 30),
        turnoverRate: draggedSiemensRow.turnoverRate,
      });

      if (autoAdaptCaseOnDrop) {
        onSetBinWidthCm(targetBinId, draggedSiemensRow.widthCm + 8);
      }

      setStatusFeedback(
        `Article ${draggedSiemensRow.reference} (${draggedSiemensRow.lengthCm}×${draggedSiemensRow.widthCm}×${draggedSiemensRow.heightCm}cm) affecté à ${targetBinCode}.`
      );
    }
    setDraggedBinId(null);
    setDraggedSiemensRow(null);
    setDragOverBinId(null);
  };

  const pad = Math.max(
    2,
    Math.min(roomDimensions.widthMeters, roomDimensions.depthMeters) * 0.28
  );
  const viewW = roomDimensions.widthMeters + pad * 2;
  const viewD = roomDimensions.depthMeters + pad * 2;
  const halfRoomW = roomDimensions.widthMeters / 2;
  const halfRoomD = roomDimensions.depthMeters / 2;

  return (
    <div
      className="fixed inset-0 top-14 z-30 bg-[#0B1120] flex flex-col overflow-hidden select-none"
      aria-label="Studio Plan 2D Vue de Haut et Configuration Drag and Drop des Cases Inégales Siemens"
      onPointerMove={(e) => {
        if (!dividerDrag) return;
        const deltaPx = e.clientX - dividerDrag.startClientX;
        if (Math.abs(deltaPx) < 3) return;
        const deltaRatio = deltaPx / Math.max(120, dividerDrag.rowPixelWidth);
        onResizeShelfDivider(
          dividerDrag.cabinetId,
          dividerDrag.shelfIndex,
          dividerDrag.leftColIndex,
          deltaRatio
        );
        setDividerDrag({
          ...dividerDrag,
          startClientX: e.clientX,
        });
      }}
      onPointerUp={() => {
        if (dividerDrag) {
          setDividerDrag(null);
          
        }
      }}
    >
      {/* Top Sub-Toolbar */}
      <div className="px-6 py-2.5 bg-[#0F172A] border-b border-slate-800 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-sm font-bold text-slate-100 font-display whitespace-nowrap shrink-0">
            Studio 2D Magasinier — Plan Salle, Cases Inégales &amp; Gestion de Stock
          </span>
          <span className="text-slate-600 shrink-0">·</span>
          <span className="text-xs text-amber-400 font-mono truncate">
            {statusFeedback}
          </span>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          {/* Tool Mode Switcher */}
          <div className="flex items-center gap-1 p-1 bg-[#0B1120] border border-slate-800 rounded-lg">
            <button
              type="button"
              onClick={() => setToolMode('move')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                toolMode === 'move'
                  ? 'bg-amber-500 text-slate-950 font-semibold'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Move className="w-3.5 h-3.5" />
              <span>Déplacer / Redimensionner (Drag &amp; Drop)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setToolMode('draw-rect');
                setStatusFeedback(
                  'Mode Dessin Rectangle actif : cliquez et glissez sur le plan 2D pour tracer une armoire de toute dimension.'
                );
              }}
              className={`px-3 py-1.5 text-xs font-medium rounded-md flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                toolMode === 'draw-rect'
                  ? 'bg-emerald-500 text-slate-950 font-semibold'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <SquarePlus className="w-3.5 h-3.5" />
              <span>Tracer un Rectangle d&apos;Armoire</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onSwitchTo3D}
            className="px-4 py-1.5 text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>Valider &amp; Voir en 3D</span>
          </button>
        </div>
      </div>

      {/* Main 3-Column Studio Workspace */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
        {/* LEFT COLUMN (3 cols): Siemens Excel Upload & Draggable References + Free Room Dimensioning */}
        <div className="lg:col-span-3 bg-[#0F172A] border-r border-slate-800 p-3.5 overflow-y-auto space-y-4">
          {/* Section 1: Upload Excel Siemens Products & Auto-Organize */}
          <div className="p-3.5 bg-[#0B1120] border border-cyan-500/40 rounded-xl space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                <FileSpreadsheet className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>1. Liste des Articles & Colis</span>
              </h2>
              <span className="text-[11px] font-mono text-cyan-400 tabular-nums">
                {siemensProducts.length} réf.
              </span>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              Importez un fichier Excel (<strong>.xlsx, .xls, .csv</strong>) avec les références Siemens et leurs dimensions libres (L×l×H cm), puis glissez-les dans les cases 2D.
            </p>

            <input
              ref={excelInputRef}
              type="file"
              accept=".xlsx,.xls,.csv,.tsv"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleExcelFileUpload(file);
              }}
              className="hidden"
            />

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => excelInputRef.current?.click()}
                className="px-2.5 py-2 text-xs font-semibold bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Importer Excel (.xlsx)</span>
              </button>

              <button
                type="button"
                onClick={() => downloadSiemensExcelTemplate(siemensProducts)}
                className="px-2.5 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <Download className="w-3.5 h-3.5 text-cyan-400" />
                <span>Modèle Excel (XLSX)</span>
              </button>
            </div>

            <div className="text-[10px] font-mono text-slate-400 truncate">
              Source : <span className="text-slate-200">{importedFileName}</span>
            </div>

            {/* 1-Click Auto-Organize Selected Cabinet in 2D */}
            {selectedCabinet && (
              <button
                type="button"
                onClick={() => {
                  onAutoOrganizeSiemensCabinet(
                    selectedCabinet.id,
                    siemensProducts
                  );
                  setStatusFeedback(
                    `Armoire ${selectedCabinet.code} auto-organisée en 2D : cases redimensionnées selon les dimensions d'emballage Siemens.`
                  );
                }}
                className="w-full px-3 py-2 text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 shrink-0" />
                <span>
                  Auto-Organiser {selectedCabinet.code} selon Dimensions
                </span>
              </button>
            )}

            <label className="flex items-center gap-2 text-[11px] text-slate-300 cursor-pointer pt-0.5">
              <input
                type="checkbox"
                checked={autoAdaptCaseOnDrop}
                onChange={(e) => setAutoAdaptCaseOnDrop(e.target.checked)}
                className="accent-amber-500 rounded"
              />
              <span>
                Adapter automatiquement la largeur de la case au produit déposé
              </span>
            </label>

            {/* Draggable Siemens Excel Rows */}
            <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1 pt-1 border-t border-slate-800">
              {siemensProducts.map((item) => (
                <div
                  key={item.id}
                  draggable
                  onDragStart={() => {
                    setDraggedSiemensRow(item);
                    setDraggedBinId(null);
                  }}
                  onDragEnd={() => {
                    setDraggedSiemensRow(null);
                    setDragOverBinId(null);
                  }}
                  className="p-2 bg-[#0F172A] hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/50 rounded-lg cursor-grab active:cursor-grabbing transition-colors flex items-center justify-between gap-2 text-xs"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <GripVertical className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <div className="min-w-0">
                      <div className="font-mono font-bold text-amber-300 text-[11px] truncate">
                        {item.reference}
                      </div>
                      <div className="text-[11px] text-slate-200 truncate">
                        {item.name.replace(/^Siemens\s+/i, '')}
                      </div>
                      <div className="text-[10px] font-mono text-cyan-300 tabular-nums">
                        Dim: {item.lengthCm}×{item.widthCm}×{item.heightCm} cm ·{' '}
                        {item.weightKg}kg
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0 font-mono">
                    <div className="text-[10px] text-emerald-400 font-bold tabular-nums">
                      {item.turnoverRate}/an
                    </div>
                    <div className="text-[10px] text-slate-400 tabular-nums">
                      Qté {item.quantity}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 2: Free Room Dimensioning (No Minimum Limit) */}
          <div className="p-3.5 bg-[#0B1120] border border-slate-800 rounded-xl space-y-2.5">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                <Maximize2 className="w-3.5 h-3.5 text-amber-400" />
                <span>2. Dimensionnement Libre de la Salle</span>
              </h2>
              <span className="text-xs font-mono text-amber-400 tabular-nums">
                {(roomDimensions.widthMeters * roomDimensions.depthMeters).toFixed(1)} m²
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label
                  htmlFor="room-width-input"
                  className="block text-[11px] text-slate-300 mb-1"
                >
                  Largeur Salle X (m)
                </label>
                <input
                  id="room-width-input"
                  type="number"
                  step="any"
                  value={roomDimensions.widthMeters}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    if (!Number.isNaN(val) && val > 0) {
                      onUpdateRoomDimensions({ widthMeters: val });
                    }
                  }}
                  className="w-full px-2.5 py-1.5 text-xs font-mono tabular-nums bg-[#0F172A] border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label
                  htmlFor="room-depth-input"
                  className="block text-[11px] text-slate-300 mb-1"
                >
                  Profondeur Salle Z (m)
                </label>
                <input
                  id="room-depth-input"
                  type="number"
                  step="any"
                  value={roomDimensions.depthMeters}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    if (!Number.isNaN(val) && val > 0) {
                      onUpdateRoomDimensions({ depthMeters: val });
                    }
                  }}
                  className="w-full px-2.5 py-1.5 text-xs font-mono tabular-nums bg-[#0F172A] border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="room-grid-step"
                className="block text-[11px] text-slate-400 mb-1"
              >
                Pas de Grille Magnétique
              </label>
              <select
                id="room-grid-step"
                value={roomDimensions.gridStepMeters}
                onChange={(e) =>
                  onUpdateRoomDimensions({
                    gridStepMeters: Number(e.target.value),
                  })
                }
                className="w-full px-2 py-1.5 text-xs font-mono bg-[#0F172A] border border-slate-700 rounded-lg text-slate-200"
              >
                <option value={0.01}>0.01 m (Libre / 1 cm)</option>
                <option value={0.1}>0.10 m (10 cm)</option>
                <option value={0.25}>0.25 m (25 cm)</option>
                <option value={0.5}>0.50 m (50 cm)</option>
              </select>
            </div>
          </div>

          {/* Section 3: Draggable Rectangular Cabinet Templates */}
          <div className="p-3.5 bg-[#0B1120] border border-slate-800 rounded-xl space-y-2.5">
            <div>
              <h2 className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                <SquarePlus className="w-3.5 h-3.5 text-amber-400" />
                <span>3. Insérer une Armoire (Plan 2D)</span>
              </h2>
            </div>

            <div className="space-y-2">
              {CABINET_TEMPLATES.map((tpl) => (
                <div
                  key={tpl.id}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData(
                      'application/x-optistock-cabinet-tpl',
                      tpl.id
                    );
                  }}
                  className="p-2.5 bg-[#0F172A] hover:bg-slate-800/80 border border-slate-700/80 rounded-lg cursor-grab active:cursor-grabbing transition-colors space-y-1"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <GripVertical className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span
                        className="w-2.5 h-2.5 rounded-xs shrink-0"
                        style={{ backgroundColor: tpl.accentColor }}
                      />
                      <span className="text-xs font-semibold text-slate-100 truncate">
                        {tpl.label}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleQuickInsertTemplate(tpl)}
                      className="px-2 py-0.5 text-[11px] font-semibold bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-slate-950 rounded transition-colors cursor-pointer whitespace-nowrap shrink-0"
                    >
                      + Insérer
                    </button>
                  </div>
                  <div className="text-[10px] font-mono text-slate-400 pl-5">
                    {tpl.subtitle}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CENTER COLUMN (4 cols): Interactive 2D Top-Down Blueprint Canvas (Without Quai d'Expédition) */}
        <div className="lg:col-span-4 bg-[#080D1A] relative flex flex-col items-center justify-center p-3.5 overflow-hidden">
          <div className="w-full flex items-center justify-between mb-2 px-1 text-xs font-mono text-slate-400">
            <span>
              SALLE 2D :{' '}
              <strong className="text-slate-100 tabular-nums">
                {roomDimensions.widthMeters}m × {roomDimensions.depthMeters}m
              </strong>
            </span>
            <span>
              ARMOIRES :{' '}
              <strong className="text-amber-400 tabular-nums">
                {cabinets.length}
              </strong>{' '}
              (Cliquez pour organiser)
            </span>
          </div>

          <svg
            ref={svgRef}
            data-testid="floorplan-2d-svg"
            viewBox={`${-viewW / 2} ${-viewD / 2} ${viewW} ${viewD}`}
            onPointerDown={handleSvgPointerDown}
            onPointerMove={handleSvgPointerMove}
            onPointerUp={handleSvgPointerUp}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDropTemplateOnFloorPlan}
            className={`w-full h-full max-h-[75vh] bg-[#0B1120] border border-slate-800 rounded-xl shadow-inner ${
              toolMode === 'draw-rect' ? 'cursor-crosshair' : 'cursor-default'
            }`}
          >
            {/* Outer blueprint background */}
            <rect
              data-floor-bg="true"
              x={-viewW / 2}
              y={-viewD / 2}
              width={viewW}
              height={viewD}
              fill="#070B14"
            />

            {/* Room Interior Floor Surface */}
            <rect
              data-floor-bg="true"
              x={-halfRoomW}
              y={-halfRoomD}
              width={roomDimensions.widthMeters}
              height={roomDimensions.depthMeters}
              fill="#0F172A"
              stroke="#475569"
              strokeWidth={Math.max(0.04, viewW * 0.004)}
            />

            {/* Metric Grid Lines inside Room */}
            {Array.from(
              { length: Math.min(80, Math.floor(roomDimensions.widthMeters)) + 1 },
              (_, i) => -halfRoomW + i
            ).map((gx) => (
              <line
                key={`gx-${gx}`}
                data-floor-bg="true"
                x1={gx}
                y1={-halfRoomD}
                x2={gx}
                y2={halfRoomD}
                stroke={Math.abs(gx) < 0.01 ? '#334155' : '#1E293B'}
                strokeWidth={Math.max(0.02, viewW * 0.0015)}
              />
            ))}
            {Array.from(
              { length: Math.min(80, Math.floor(roomDimensions.depthMeters)) + 1 },
              (_, i) => -halfRoomD + i
            ).map((gz) => (
              <line
                key={`gz-${gz}`}
                data-floor-bg="true"
                x1={-halfRoomW}
                y1={gz}
                x2={halfRoomW}
                y2={gz}
                stroke={Math.abs(gz) < 0.01 ? '#334155' : '#1E293B'}
                strokeWidth={Math.max(0.02, viewW * 0.0015)}
              />
            ))}

            {/* Top Room Width Dimension Ruler */}
            <g pointerEvents="none">
              <line
                x1={-halfRoomW}
                y1={-halfRoomD - pad * 0.35}
                x2={halfRoomW}
                y2={-halfRoomD - pad * 0.35}
                stroke="#f59e0b"
                strokeWidth={Math.max(0.03, viewW * 0.002)}
              />
              <text
                x={0}
                y={-halfRoomD - pad * 0.5}
                textAnchor="middle"
                fill="#fbbf24"
                fontSize={Math.max(0.28, viewW * 0.024)}
                fontFamily="JetBrains Mono, monospace"
                fontWeight="bold"
              >
                LARGEUR SALLE : {roomDimensions.widthMeters} m
              </text>
            </g>

            {/* Left Room Depth Dimension Ruler */}
            <g pointerEvents="none">
              <line
                x1={-halfRoomW - pad * 0.35}
                y1={-halfRoomD}
                x2={-halfRoomW - pad * 0.35}
                y2={halfRoomD}
                stroke="#f59e0b"
                strokeWidth={Math.max(0.03, viewW * 0.002)}
              />
              <text
                x={-halfRoomW - pad * 0.52}
                y={0}
                textAnchor="middle"
                fill="#fbbf24"
                fontSize={Math.max(0.28, viewW * 0.024)}
                fontFamily="JetBrains Mono, monospace"
                fontWeight="bold"
                transform={`rotate(-90, ${-halfRoomW - pad * 0.52}, 0)`}
              >
                PROFONDEUR : {roomDimensions.depthMeters} m
              </text>
            </g>

            {/* Draggable East Wall Handle to Resize Room Width */}
            <rect
              x={halfRoomW - Math.max(0.08, viewW * 0.006)}
              y={-Math.min(2.2, roomDimensions.depthMeters * 0.25)}
              width={Math.max(0.16, viewW * 0.012)}
              height={Math.min(4.4, roomDimensions.depthMeters * 0.5)}
              rx={0.08}
              fill="#f59e0b"
              className="cursor-ew-resize"
              onPointerDown={(e) => {
                e.stopPropagation();
                setDragState({
                  type: 'resize-room-width',
                });
              }}
            />

            {/* Draggable South Wall Handle to Resize Room Depth */}
            <rect
              x={-Math.min(2.2, roomDimensions.widthMeters * 0.25)}
              y={halfRoomD - Math.max(0.08, viewW * 0.006)}
              width={Math.min(4.4, roomDimensions.widthMeters * 0.5)}
              height={Math.max(0.16, viewW * 0.012)}
              rx={0.08}
              fill="#f59e0b"
              className="cursor-ns-resize"
              onPointerDown={(e) => {
                e.stopPropagation();
                setDragState({
                  type: 'resize-room-depth',
                });
              }}
            />

            {/* Render Each Cabinet as a Top-Down Interactive Draggable & Resizable Rectangle */}
            {cabinets.map((cab) => {
              const isSelected = cab.id === selectedCabinet?.id;
              const { footprintX, footprintZ } = getCabinetFootprint(cab);
              const collisionWith = checkCabinetCollision(cab, cabinets);
              const occupiedCount = cab.bins.filter(
                (b) => b.product !== null
              ).length;

              const leftX = cab.position.x - footprintX / 2;
              const shelf1Geoms = getShelfBinsWithGeometry(cab, 1);

              return (
                <g key={cab.id}>
                  {/* Distance-to-wall cotes when selected */}
                  {isSelected && (
                    <g pointerEvents="none">
                      <line
                        x1={-halfRoomW}
                        y1={cab.position.z}
                        x2={leftX}
                        y2={cab.position.z}
                        stroke="#38bdf8"
                        strokeWidth={Math.max(0.025, viewW * 0.0018)}
                        strokeDasharray="0.2 0.15"
                      />
                      <text
                        x={(-halfRoomW + leftX) / 2}
                        y={cab.position.z - 0.22}
                        textAnchor="middle"
                        fill="#38bdf8"
                        fontSize={Math.max(0.24, viewW * 0.018)}
                        fontFamily="JetBrains Mono, monospace"
                      >
                        {(leftX - -halfRoomW).toFixed(2)}m
                      </text>
                    </g>
                  )}

                  {/* Cabinet Rectangle Group */}
                  <g
                    transform={`translate(${cab.position.x}, ${cab.position.z})`}
                    className="cursor-move"
                    onPointerDown={(e) => {
                      if (toolMode === 'draw-rect') return;
                      e.stopPropagation();
                      onSelectCabinet(cab.id);
                      const pt = clientToWorldXZ(e.clientX, e.clientY);
                      setDragState({
                        type: 'move-cabinet',
                        cabinetId: cab.id,
                        offsetX: pt.x - cab.position.x,
                        offsetZ: pt.z - cab.position.z,
                      });
                    }}
                  >
                    {/* Main Footprint Rectangle */}
                    <rect
                      x={-footprintX / 2}
                      y={-footprintZ / 2}
                      width={footprintX}
                      height={footprintZ}
                      rx={0.05}
                      fill={
                        collisionWith
                          ? 'rgba(239, 68, 68, 0.35)'
                          : isSelected
                          ? 'rgba(245, 158, 11, 0.28)'
                          : 'rgba(30, 41, 59, 0.92)'
                      }
                      stroke={
                        collisionWith
                          ? '#ef4444'
                          : isSelected
                          ? '#fbbf24'
                          : cab.accentColor
                      }
                      strokeWidth={isSelected ? Math.max(0.06, viewW * 0.004) : Math.max(0.03, viewW * 0.002)}
                    />

                    {/* Internal unequal compartment subdivision lines inside the 2D rectangle */}
                    {shelf1Geoms.map((g, i) => {
                      if (i === 0) return null;
                      const isRot =
                        cab.rotationY === 90 || cab.rotationY === 270;
                      if (isRot) {
                        const lineY =
                          -footprintZ / 2 + g.startRatio * footprintZ;
                        return (
                          <line
                            key={g.bin.id}
                            x1={-footprintX / 2}
                            y1={lineY}
                            x2={footprintX / 2}
                            y2={lineY}
                            stroke="#475569"
                            strokeWidth={0.03}
                          />
                        );
                      }
                      const lineX = -footprintX / 2 + g.startRatio * footprintX;
                      return (
                        <line
                          key={g.bin.id}
                          x1={lineX}
                          y1={-footprintZ / 2}
                          x2={lineX}
                          y2={footprintZ / 2}
                          stroke="#475569"
                          strokeWidth={0.03}
                        />
                      );
                    })}

                    {/* Cabinet Code Label */}
                    <text
                      x={0}
                      y={0.12}
                      textAnchor="middle"
                      fill="#f8fafc"
                      fontSize={Math.max(0.24, Math.min(0.46, footprintX * 0.18))}
                      fontFamily="Space Grotesk, sans-serif"
                      fontWeight="bold"
                      pointerEvents="none"
                    >
                      {cab.code}
                    </text>

                    {/* Dimensions & Bins Tag above rectangle */}
                    <text
                      x={0}
                      y={-footprintZ / 2 - 0.18}
                      textAnchor="middle"
                      fill={isSelected ? '#fbbf24' : '#94a3b8'}
                      fontSize={Math.max(0.2, viewW * 0.015)}
                      fontFamily="JetBrains Mono, monospace"
                      pointerEvents="none"
                    >
                      {footprintX.toFixed(2)}m × {footprintZ.toFixed(2)}m (
                      {occupiedCount}/{cab.bins.length})
                    </text>

                    {/* Interactive Resize Handles when selected */}
                    {isSelected && (
                      <>
                        <circle
                          cx={footprintX / 2}
                          cy={0}
                          r={Math.max(0.12, viewW * 0.008)}
                          fill="#f59e0b"
                          stroke="#0f172a"
                          strokeWidth={0.04}
                          className="cursor-ew-resize"
                          onPointerDown={(e) => {
                            e.stopPropagation();
                            setDragState({
                              type: 'resize-cabinet-width',
                              cabinetId: cab.id,
                            });
                          }}
                        />
                        <circle
                          cx={0}
                          cy={footprintZ / 2}
                          r={Math.max(0.12, viewW * 0.008)}
                          fill="#38bdf8"
                          stroke="#0f172a"
                          strokeWidth={0.04}
                          className="cursor-ns-resize"
                          onPointerDown={(e) => {
                            e.stopPropagation();
                            setDragState({
                              type: 'resize-cabinet-depth',
                              cabinetId: cab.id,
                            });
                          }}
                        />
                      </>
                    )}
                  </g>
                </g>
              );
            })}

            {/* Live Drawn Rectangle Preview */}
            {dragState?.type === 'draw-new-rect' && (
              <g pointerEvents="none">
                <rect
                  x={Math.min(dragState.startX, dragState.currentX)}
                  y={Math.min(dragState.startZ, dragState.currentZ)}
                  width={Math.max(
                    0.05,
                    Math.abs(dragState.currentX - dragState.startX)
                  )}
                  height={Math.max(
                    0.05,
                    Math.abs(dragState.currentZ - dragState.startZ)
                  )}
                  fill="rgba(16, 185, 129, 0.25)"
                  stroke="#10b981"
                  strokeWidth={0.06}
                  strokeDasharray="0.2 0.15"
                />
              </g>
            )}
          </svg>

          <div className="w-full flex items-center justify-between mt-2 px-1 text-[11px] text-slate-400">
            <span>
              Cliquez sur une armoire en 2D pour configurer librement ses dimensions, ses étagères et ses cases inégales à droite.
            </span>
          </div>
        </div>

        {/* RIGHT COLUMN (5 cols): 2D Frontal Elevation of Selected Cabinet — Manual Unequal Cases & Free Dimensions */}
        <div className="lg:col-span-5 bg-[#0F172A] border-l border-slate-800 p-4 overflow-y-auto space-y-4">
          {selectedCabinet ? (
            <>
              {/* Cabinet Header & Direct Free Dimension Inputs */}
              <div className="p-3.5 bg-[#0B1120] border border-slate-800 rounded-xl space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-[11px] font-mono text-amber-400">
                      ÉLÉVATION 2D DE L&apos;ARMOIRE SÉLECTIONNÉE (DIMENSIONS LIBRES)
                    </div>
                    <h3 className="text-base font-bold text-slate-100 font-display truncate">
                      {selectedCabinet.code} —{' '}
                      {selectedCabinet.name.replace(/^Armoire [A-Z0-9-]+ — /, '')}
                    </h3>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      title="Pivoter l'armoire de 90° sur le plan 2D"
                      onClick={() =>
                        onUpdateCabinet(selectedCabinet.id, {
                          rotationY: (selectedCabinet.rotationY + 90) % 360,
                        })
                      }
                      className="px-2.5 py-1.5 text-xs font-mono bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCw className="w-3.5 h-3.5 text-amber-400" />
                      <span>{selectedCabinet.rotationY}°</span>
                    </button>

                    <button
                      type="button"
                      title="Supprimer cette armoire"
                      onClick={() => onDeleteCabinet(selectedCabinet.id)}
                      className="p-1.5 text-red-400 hover:text-white bg-red-950/50 hover:bg-red-900 border border-red-800/60 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {checkCabinetCollision(selectedCabinet, cabinets) && (
                  <div className="p-2.5 bg-red-950/70 border border-red-700 rounded-lg flex items-center gap-2 text-xs text-red-200">
                    <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                    <span>
                      Chevauchement avec{' '}
                      <strong>
                        {checkCabinetCollision(selectedCabinet, cabinets)}
                      </strong>
                      . Déplacez le rectangle sur le plan 2D.
                    </span>
                  </div>
                )}

                {/* Free Cabinet Dimensions: Nb Shelves, Exact Width (cm), Exact Depth (cm) */}
                <div className="grid grid-cols-3 gap-2 text-xs font-mono">
                  <div className="p-2 bg-[#0F172A] border border-slate-800 rounded-lg">
                    <div className="text-[10px] text-slate-400">
                      Nb Étagères
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <button
                        type="button"
                        aria-label="Retirer une étagère"
                        onClick={() =>
                          onUpdateCabinet(selectedCabinet.id, {
                            shelvesCount: Math.max(
                              1,
                              selectedCabinet.shelvesCount - 1
                            ),
                          })
                        }
                        className="p-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-200 cursor-pointer"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="font-bold text-slate-100 tabular-nums">
                        {selectedCabinet.shelvesCount}
                      </span>
                      <button
                        type="button"
                        aria-label="Ajouter une étagère"
                        onClick={() =>
                          onUpdateCabinet(selectedCabinet.id, {
                            shelvesCount: selectedCabinet.shelvesCount + 1,
                          })
                        }
                        className="p-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-200 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  <div className="p-2 bg-[#0F172A] border border-slate-800 rounded-lg">
                    <label
                      htmlFor="cab-width-cm-input"
                      className="block text-[10px] text-slate-400"
                    >
                      Largeur Armoire (cm)
                    </label>
                    <input
                      id="cab-width-cm-input"
                      type="number"
                      step="any"
                      value={Math.round(selectedCabinet.widthMeters * 100)}
                      onChange={(e) => {
                        const valCm = parseFloat(e.target.value);
                        if (!Number.isNaN(valCm) && valCm > 0) {
                          onUpdateCabinet(selectedCabinet.id, {
                            widthMeters: valCm / 100,
                          });
                        }
                      }}
                      className="w-full mt-1 px-2 py-0.5 text-xs font-mono font-bold text-amber-400 tabular-nums bg-[#0B1120] border border-slate-700 rounded focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="p-2 bg-[#0F172A] border border-slate-800 rounded-lg">
                    <label
                      htmlFor="cab-depth-cm-input"
                      className="block text-[10px] text-slate-400"
                    >
                      Profondeur (cm)
                    </label>
                    <input
                      id="cab-depth-cm-input"
                      type="number"
                      step="any"
                      value={Math.round(selectedCabinet.depthMeters * 100)}
                      onChange={(e) => {
                        const valCm = parseFloat(e.target.value);
                        if (!Number.isNaN(valCm) && valCm > 0) {
                          onUpdateCabinet(selectedCabinet.id, {
                            depthMeters: valCm / 100,
                          });
                        }
                      }}
                      className="w-full mt-1 px-2 py-0.5 text-xs font-mono font-bold text-cyan-300 tabular-nums bg-[#0B1120] border border-slate-700 rounded focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              </div>

              {/* Interactive 2D Frontal Shelf-by-Shelf Blueprint with Unequal Cases & Draggable Dividers */}
              <div className="p-3.5 bg-[#0B1120] border border-slate-800 rounded-xl space-y-3">
                <div>
                  <h4 className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-amber-400" />
                    <span>
                      Découpage 2D Manuel des Étagères &amp; Cases Inégales ({selectedCabinet.code})
                    </span>
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Aucune dimension minimale : glissez les cloisons{' '}
                    <strong className="text-amber-400">||</strong> entre les cases, saisissez directement la largeur/hauteur en cm ou déposez un article.
                  </p>
                </div>

                {/* Shelves from Top (EN) down to Bottom (E1) */}
                <div className="space-y-3">
                  {Array.from(
                    { length: selectedCabinet.shelvesCount },
                    (_, idx) => selectedCabinet.shelvesCount - idx
                  ).map((shelfNum) => {
                    const shelfGeoms = getShelfBinsWithGeometry(
                      selectedCabinet,
                      shelfNum
                    );
                    const shelfHeightCm = getShelfHeightCm(
                      selectedCabinet,
                      shelfNum
                    );

                    return (
                      <div
                        key={shelfNum}
                        className="p-2.5 bg-[#0F172A] border border-slate-800 rounded-xl space-y-2"
                      >
                        {/* Per-Shelf Control Header */}
                        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 font-bold rounded">
                              Étagère E{shelfNum} ({shelfGeoms.length} cases)
                            </span>

                            {/* Direct Shelf Height Input (cm) */}
                            <div className="flex items-center gap-1 bg-[#0B1120] border border-slate-800 px-1.5 py-0.5 rounded text-slate-300">
                              <span className="text-[10px] text-slate-400">
                                Haut (cm):
                              </span>
                              <input
                                type="number"
                                step="any"
                                aria-label={`Hauteur étagère E${shelfNum} en cm`}
                                value={shelfHeightCm}
                                onChange={(e) => {
                                  const val = parseFloat(e.target.value);
                                  if (!Number.isNaN(val) && val > 0) {
                                    onUpdateShelfHeightCm(
                                      selectedCabinet.id,
                                      shelfNum,
                                      val
                                    );
                                  }
                                }}
                                className="w-12 px-1 py-0 text-center text-amber-400 font-bold tabular-nums bg-transparent focus:outline-none"
                              />
                            </div>
                          </div>

                          {/* Independent Case Count & Unequal Split Controls for THIS Shelf */}
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() =>
                                onApplyShelfPreset(
                                  selectedCabinet.id,
                                  shelfNum,
                                  [0.6, 0.4]
                                )
                              }
                              className="px-1.5 py-0.5 text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 rounded cursor-pointer"
                            >
                              2 Inég. (60/40)
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                onApplyShelfPreset(
                                  selectedCabinet.id,
                                  shelfNum,
                                  [0.45, 0.3, 0.25]
                                )
                              }
                              className="px-1.5 py-0.5 text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 rounded cursor-pointer"
                            >
                              3 Inég. (45/30/25)
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                onRemoveBinFromShelf(
                                  selectedCabinet.id,
                                  shelfNum
                                )
                              }
                              className="px-2 py-0.5 text-[10px] font-bold bg-slate-800 hover:bg-red-900/70 text-slate-200 rounded cursor-pointer"
                            >
                              - Case
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                onAddBinToShelf(selectedCabinet.id, shelfNum)
                              }
                              className="px-2 py-0.5 text-[10px] font-bold bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-slate-950 rounded cursor-pointer"
                            >
                              + Case
                            </button>
                          </div>
                        </div>

                        {/* Proportional 2D Shelf Row with Unequal Cases & Draggable Vertical Dividers */}
                        <div className="flex items-stretch w-full min-h-20 bg-[#070B14] border-b-4 border-amber-500/80 rounded-lg p-1 relative">
                          {shelfGeoms.map((geom, idx) => {
                            const {
                              bin,
                              widthRatio,
                              widthCm,
                              fitsProductDimensionally,
                            } = geom;
                            const isBinSel = bin.id === selectedBinId;
                            const isDragOver = bin.id === dragOverBinId;
                            const hasProd = bin.product !== null;

                            return (
                              <React.Fragment key={bin.id}>
                                {/* Individual 2D Case Box scaled by widthRatio */}
                                <div
                                  style={{
                                    width: `${(widthRatio * 100).toFixed(2)}%`,
                                  }}
                                  draggable={hasProd}
                                  onDragStart={() => {
                                    setDraggedBinId(bin.id);
                                    setDraggedSiemensRow(null);
                                  }}
                                  onDragOver={(e) => {
                                    e.preventDefault();
                                    if (dragOverBinId !== bin.id) {
                                      setDragOverBinId(bin.id);
                                    }
                                  }}
                                  onDragLeave={() => {
                                    if (dragOverBinId === bin.id) {
                                      setDragOverBinId(null);
                                    }
                                  }}
                                  onDrop={(e) => {
                                    e.preventDefault();
                                    handleDropOnBin(bin.id, bin.code);
                                  }}
                                  onClick={() =>
                                    onSelectBin(selectedCabinet.id, bin.id)
                                  }
                                  className={`p-2 rounded border text-left transition-all flex flex-col justify-between cursor-pointer overflow-hidden ${
                                    isDragOver
                                      ? 'bg-emerald-500/25 border-emerald-400'
                                      : isBinSel
                                      ? 'bg-amber-500/20 border-amber-400 text-white'
                                      : hasProd
                                      ? 'bg-[#0F172A] border-slate-700 text-slate-200 hover:border-slate-500 cursor-grab active:cursor-grabbing'
                                      : 'bg-slate-950/60 border-slate-800/80 text-slate-500 hover:border-slate-700'
                                  }`}
                                >
                                  <div className="flex items-center justify-between gap-1 text-[10px] font-mono">
                                    <span className="font-bold text-slate-300 truncate">
                                      C{bin.colIndex} ·{' '}
                                      <strong className="text-cyan-300">
                                        {widthCm}cm
                                      </strong>
                                    </span>
                                    {bin.product && (
                                      <span className="text-amber-400 font-bold shrink-0">
                                        x{bin.product.quantity}
                                      </span>
                                    )}
                                  </div>

                                  {bin.product ? (
                                    <div className="mt-1 space-y-0.5">
                                      <div className="text-[10px] font-mono font-bold text-amber-300 truncate">
                                        {bin.product.reference}
                                      </div>
                                      <div className="text-[10px] text-slate-300 truncate">
                                        {bin.product.name.replace(
                                          /^Siemens\s+/i,
                                          ''
                                        )}
                                      </div>
                                      <div className="flex items-center justify-between gap-1 text-[9px] font-mono">
                                        <span className="text-slate-400 truncate">
                                          {bin.product.dimensionsCm.lengthCm}×
                                          {bin.product.dimensionsCm.widthCm}×
                                          {bin.product.dimensionsCm.heightCm}cm
                                        </span>
                                        {!fitsProductDimensionally && (
                                          <button
                                            type="button"
                                            title="Adapter automatiquement la largeur de cette case au produit"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              onSetBinWidthCm(
                                                bin.id,
                                                bin.product!.dimensionsCm
                                                  .widthCm + 4
                                              );
                                            }}
                                            className="px-1 bg-red-500/30 text-red-200 rounded text-[9px] hover:bg-red-500"
                                          >
                                            Adapter
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="text-[10px] font-mono text-slate-500 mt-2">
                                      CASE VIDE ({widthCm}×{shelfHeightCm}cm)
                                    </div>
                                  )}
                                </div>

                                {/* Interactive Draggable Vertical Divider Between Adjacent Cases */}
                                {idx < shelfGeoms.length - 1 && (
                                  <div
                                    title="Glisser horizontalement pour redimensionner manuellement ces deux cases en 2D"
                                    onPointerDown={(e) => {
                                      e.stopPropagation();
                                      const parentEl =
                                        e.currentTarget.parentElement;
                                      const rowW =
                                        parentEl?.getBoundingClientRect()
                                          .width || 420;
                                      setDividerDrag({
                                        cabinetId: selectedCabinet.id,
                                        shelfIndex: shelfNum,
                                        leftColIndex: bin.colIndex,
                                        startClientX: e.clientX,
                                        rowPixelWidth: rowW,
                                      });
                                    }}
                                    className="w-2.5 mx-0.5 bg-slate-800 hover:bg-amber-400 active:bg-amber-300 rounded cursor-ew-resize flex items-center justify-center transition-colors shrink-0"
                                  >
                                    <span className="w-0.5 h-6 bg-slate-400 rounded-full pointer-events-none" />
                                  </div>
                                )}
                              </React.Fragment>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Selected Case Manual Width Input & Slider (No Minimum Limit: from 1 cm) */}
                {selectedBin && selectedBinGeometry && (
                  <div className="p-3 bg-[#0F172A] border border-amber-500/40 rounded-xl space-y-2">
                    <div className="flex items-center justify-between gap-2 text-xs font-mono">
                      <span className="text-slate-200 font-bold flex items-center gap-1.5">
                        <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" />
                        <span>Largeur Case {selectedBin.code} (cm) :</span>
                      </span>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          step="any"
                          aria-label="Saisie directe largeur de case en cm"
                          value={selectedBinGeometry.widthCm}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            if (!Number.isNaN(val) && val > 0) {
                              onSetBinWidthCm(selectedBin.id, val);
                            }
                          }}
                          className="w-20 px-2 py-0.5 text-xs font-mono font-bold text-amber-400 tabular-nums bg-[#0B1120] border border-slate-700 rounded focus:outline-none focus:border-amber-500"
                        />
                        <span className="text-slate-400 tabular-nums">
                          ({Math.round(selectedBinGeometry.widthRatio * 100)}%)
                        </span>
                      </div>
                    </div>

                    <input
                      type="range"
                      aria-label="Largeur manuelle de la case en cm"
                      min={1}
                      max={Math.max(10, Math.round(selectedCabinet.widthMeters * 99))}
                      value={selectedBinGeometry.widthCm}
                      onChange={(e) =>
                        onSetBinWidthCm(selectedBin.id, Number(e.target.value))
                      }
                      className="w-full accent-amber-500 cursor-pointer"
                    />
                  </div>
                )}

                {/* Action buttons for selected Bin / Shelf */}
                <div className="pt-2 border-t border-slate-800 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={onOpenDetailedInspector}
                    className="px-3 py-2 text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Éditer Détails Case / Réf.</span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      onOpenAIScanner(
                        selectedCabinet.id,
                        selectedBin?.shelfIndex || 1
                      )
                    }
                    className="px-3 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
                  >
                    <ScanLine className="w-3.5 h-3.5" />
                    <span>Scanner Armoire par IA</span>
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="p-8 text-center text-xs text-slate-400">
              Sélectionnez ou insérez un rectangle d&apos;armoire sur le plan 2D pour configurer ses étagères et cases inégales.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
