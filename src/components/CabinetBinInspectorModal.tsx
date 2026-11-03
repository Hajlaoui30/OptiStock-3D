import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Trash2,
  Save,
  Package,
  Layers,
  ScanLine,
  ArrowUpDown,
} from 'lucide-react';
import {
  Cabinet,
  BinCase,
  ProductCategory,
  PackagingType,
  PACKAGING_PRESETS,
  ProductItem,
} from '../utils/warehouseLogic';

interface CabinetBinInspectorModalProps {
  mode: 'inspect' | 'create-cabinet';
  cabinet: Cabinet | null;
  selectedBinId: string | null;
  onSelectBin: (cabinetId: string, binId: string) => void;
  onClose: () => void;
  onCreateCabinet: (params: {
    code: string;
    name: string;
    zone: string;
    position: { x: number; z: number };
    rotationY: number;
    shelvesCount: number;
    columnsCount: number;
    accentColor: string;
  }) => void;
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
      accentColor: string;
    }>
  ) => void;
  onDeleteCabinet: (cabinetId: string) => void;
  onUpsertBinProduct: (
    binId: string,
    productInput: Omit<ProductItem, 'id' | 'lastUpdated'>
  ) => void;
  onRemoveBinProduct: (binId: string) => void;
  onSwapBins: (sourceBinId: string, targetBinId: string) => void;
  onOpenShelfScanner: (cabinetId: string, shelfIndex: number) => void;
}

const CATEGORIES: ProductCategory[] = [
  'Hydraulique',
  'Électronique',
  'Mécanique',
  'Fixation',
  'Maintenance',
];

const PACKAGING_TYPES: PackagingType[] = [
  'Bac Europe S',
  'Carton Standard M',
  'Caisse Renforcée L',
  'Coffre Lourd XL',
  'Tube / Rouleau',
];

export const CabinetBinInspectorModal: React.FC<CabinetBinInspectorModalProps> = ({
  mode,
  cabinet,
  selectedBinId,
  onSelectBin,
  onClose,
  onCreateCabinet,
  onUpdateCabinet,
  onDeleteCabinet,
  onUpsertBinProduct,
  onRemoveBinProduct,
  onSwapBins,
  onOpenShelfScanner,
}) => {
  const [activeTab, setActiveTab] = useState<'bin' | 'cabinet'>(
    mode === 'create-cabinet' ? 'cabinet' : 'bin'
  );
  const [draggedModalBinId, setDraggedModalBinId] = useState<string | null>(null);
  const [dragOverModalBinId, setDragOverModalBinId] = useState<string | null>(null);

  // Cabinet Form State
  const [cabCode, setCabCode] = useState<string>(cabinet?.code || 'ARM-D1');
  const [cabName, setCabName] = useState<string>(
    cabinet?.name || 'Armoire D1 — Outillage & Pneumatique'
  );
  const [cabZone, setCabZone] = useState<string>(
    cabinet?.zone || 'Zone D · Extension Est'
  );
  const [cabShelves, setCabShelves] = useState<number>(
    cabinet?.shelvesCount || 4
  );
  const [cabCols, setCabCols] = useState<number>(cabinet?.columnsCount || 4);
  const [cabPosX, setCabPosX] = useState<number>(cabinet?.position.x ?? 0);
  const [cabPosZ, setCabPosZ] = useState<number>(cabinet?.position.z ?? -0.4);
  const [cabRotY, setCabRotY] = useState<number>(cabinet?.rotationY ?? 0);
  const [cabColor, setCabColor] = useState<string>(
    cabinet?.accentColor || '#f59e0b'
  );

  useEffect(() => {
    if (mode === 'create-cabinet') {
      setActiveTab('cabinet');
      setCabCode('ARM-D1');
      setCabName('Armoire D1 — Pneumatique & Robotique');
      setCabZone('Zone D · Extension Centrale');
      setCabShelves(4);
      setCabCols(4);
      setCabPosX(0);
      setCabPosZ(-0.4);
      setCabRotY(0);
      setCabColor('#f59e0b');
    } else if (cabinet) {
      setCabCode(cabinet.code);
      setCabName(cabinet.name);
      setCabZone(cabinet.zone);
      setCabShelves(cabinet.shelvesCount);
      setCabCols(cabinet.columnsCount);
      setCabPosX(cabinet.position.x);
      setCabPosZ(cabinet.position.z);
      setCabRotY(cabinet.rotationY);
      setCabColor(cabinet.accentColor);
    }
  }, [mode, cabinet]);

  const activeBin: BinCase | null =
    cabinet?.bins.find((b) => b.id === selectedBinId) ||
    cabinet?.bins[0] ||
    null;

  // Product Form State for activeBin
  const [prodRef, setProdRef] = useState<string>('');
  const [prodName, setProdName] = useState<string>('');
  const [prodCategory, setProdCategory] =
    useState<ProductCategory>('Hydraulique');
  const [prodQty, setProdQty] = useState<number>(12);
  const [prodMinThreshold, setProdMinThreshold] = useState<number>(4);
  const [prodMaxCap, setProdMaxCap] = useState<number>(30);
  const [prodPackaging, setProdPackaging] =
    useState<PackagingType>('Carton Standard M');
  const [prodLengthCm, setProdLengthCm] = useState<number>(40);
  const [prodWidthCm, setProdWidthCm] = useState<number>(30);
  const [prodHeightCm, setProdHeightCm] = useState<number>(22);
  const [prodWeightKg, setProdWeightKg] = useState<number>(2.5);
  const [prodTurnover, setProdTurnover] = useState<number>(14.5);
  const [formFeedback, setFormFeedback] = useState<string | null>(null);

  useEffect(() => {
    setFormFeedback(null);
    if (activeBin?.product) {
      const p = activeBin.product;
      setProdRef(p.reference);
      setProdName(p.name);
      setProdCategory(p.category);
      setProdQty(p.quantity);
      setProdMinThreshold(p.minThreshold);
      setProdMaxCap(p.maxCapacity);
      setProdPackaging(p.packagingType);
      setProdLengthCm(p.dimensionsCm.lengthCm);
      setProdWidthCm(p.dimensionsCm.widthCm);
      setProdHeightCm(p.dimensionsCm.heightCm);
      setProdWeightKg(p.weightKg);
      setProdTurnover(p.turnoverRate);
    } else if (activeBin) {
      setProdRef(`${activeBin.cabinetCode.replace('ARM-', 'REF-')}-${activeBin.shelfIndex}0${activeBin.colIndex}`);
      setProdName('');
      setProdCategory('Mécanique');
      setProdQty(15);
      setProdMinThreshold(5);
      setProdMaxCap(30);
      setProdPackaging('Carton Standard M');
      setProdLengthCm(40);
      setProdWidthCm(30);
      setProdHeightCm(22);
      setProdWeightKg(2.4);
      setProdTurnover(12.0);
    }
  }, [activeBin?.id, activeBin?.product]);

  const handlePackagingPresetChange = (newType: PackagingType) => {
    setProdPackaging(newType);
    const preset = PACKAGING_PRESETS[newType];
    if (preset) {
      setProdLengthCm(preset.dimensionsCm.lengthCm);
      setProdWidthCm(preset.dimensionsCm.widthCm);
      setProdHeightCm(preset.dimensionsCm.heightCm);
      setProdMaxCap(preset.defaultMaxCap);
    }
  };

  const handleSaveBinProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeBin) return;
    if (!prodRef.trim() || !prodName.trim()) {
      setFormFeedback('Veuillez renseigner la référence et la désignation du produit.');
      return;
    }
    onUpsertBinProduct(activeBin.id, {
      reference: prodRef,
      name: prodName,
      category: prodCategory,
      quantity: prodQty,
      minThreshold: prodMinThreshold,
      maxCapacity: prodMaxCap,
      packagingType: prodPackaging,
      dimensionsCm: {
        lengthCm: prodLengthCm,
        widthCm: prodWidthCm,
        heightCm: prodHeightCm,
      },
      weightKg: prodWeightKg,
      turnoverRate: prodTurnover,
    });
    setFormFeedback(`Case ${activeBin.code} enregistrée (${prodRef.toUpperCase()}).`);
  };

  const handleSaveCabinetStructure = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cabCode.trim() || !cabName.trim()) {
      setFormFeedback("Veuillez renseigner le code et le nom de l'armoire.");
      return;
    }
    if (mode === 'create-cabinet') {
      onCreateCabinet({
        code: cabCode,
        name: cabName,
        zone: cabZone,
        position: { x: cabPosX, z: cabPosZ },
        rotationY: cabRotY,
        shelvesCount: cabShelves,
        columnsCount: cabCols,
        accentColor: cabColor,
      });
      onClose();
    } else if (cabinet) {
      onUpdateCabinet(cabinet.id, {
        code: cabCode,
        name: cabName,
        zone: cabZone,
        position: { x: cabPosX, z: cabPosZ },
        rotationY: cabRotY,
        shelvesCount: cabShelves,
        columnsCount: cabCols,
        accentColor: cabColor,
      });
      setFormFeedback(`Structure de l'armoire ${cabCode.toUpperCase()} mise à jour en 3D.`);
    }
  };

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-end bg-black/60 p-3 sm:p-5"
      role="dialog"
      aria-modal="true"
      aria-labelledby="inspector-modal-title"
    >
      <div className="w-full max-w-2xl h-full max-h-[92vh] bg-[#0F172A] border border-slate-800 rounded-xl shadow-2xl flex flex-col overflow-hidden">
        {/* Top Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-[#0B1120] border-b border-slate-800">
          <div>
            <h2
              id="inspector-modal-title"
              className="text-base font-bold text-slate-100 font-display"
            >
              {mode === 'create-cabinet'
                ? 'Nouvelle Armoire 3D & Configuration des Étagères'
                : `${cabinet?.code} — ${cabinet?.name.replace(/^Armoire [A-Z0-9]+ — /, '')}`}
            </h2>
            <p className="text-xs text-slate-400">
              {mode === 'create-cabinet'
                ? "Définissez les dimensions, le nombre d'étagères et de cases pour l'entrepôt 3D."
                : `${cabinet?.zone} · ${cabinet?.shelvesCount} Étagères × ${cabinet?.columnsCount} Cases`}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer l'inspecteur d'armoire"
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Segmented Mode Tabs */}
        {mode !== 'create-cabinet' && cabinet && (
          <div className="px-5 pt-3 bg-[#0B1120] border-b border-slate-800 flex items-center justify-between gap-2 pb-3">
            <div className="flex items-center gap-1 p-1 bg-[#0F172A] border border-slate-800 rounded-lg">
              <button
                type="button"
                onClick={() => setActiveTab('bin')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
                  activeTab === 'bin'
                    ? 'bg-amber-500 text-slate-950 font-semibold'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Package className="w-3.5 h-3.5" />
                <span>Cases ({activeBin?.code})</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('cabinet')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
                  activeTab === 'cabinet'
                    ? 'bg-amber-500 text-slate-950 font-semibold'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Structure Armoire</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() =>
                onOpenShelfScanner(cabinet.id, activeBin?.shelfIndex || 1)
              }
              className="px-3 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-amber-400 border border-amber-500/30 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <ScanLine className="w-3.5 h-3.5 shrink-0" />
              <span>Scanner Étag. E{activeBin?.shelfIndex || 1} IA</span>
            </button>
          </div>
        )}

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {formFeedback && (
            <div className="p-3 bg-emerald-950/60 border border-emerald-700/70 rounded-lg text-xs text-emerald-200">
              {formFeedback}
            </div>
          )}

          {activeTab === 'bin' && cabinet && activeBin && (
            <>
              {/* Interactive 2D Shelf/Bin Matrix of this Cabinet */}
              <div className="p-4 bg-[#0B1120] border border-slate-800 rounded-lg space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-200">
                    Sélection &amp; Drag-and-Drop des Cases ({cabinet.code})
                  </span>
                  <span className="text-slate-400 font-mono">
                    Glissez une case sur une autre pour échanger les articles
                  </span>
                </div>

                <div className="space-y-2">
                  {Array.from(
                    { length: cabinet.shelvesCount },
                    (_, idx) => cabinet.shelvesCount - idx
                  ).map((shelfNum) => {
                    const rowBins = cabinet.bins.filter(
                      (b) => b.shelfIndex === shelfNum
                    );
                    return (
                      <div
                        key={shelfNum}
                        className="flex items-center gap-2"
                      >
                        <button
                          type="button"
                          onClick={() =>
                            onOpenShelfScanner(cabinet.id, shelfNum)
                          }
                          title={`Scanner l'étagère E${shelfNum} avec l'IA`}
                          className="w-20 py-2 px-2 text-[11px] font-mono bg-[#0F172A] hover:bg-slate-800 border border-slate-800 rounded text-slate-300 flex items-center justify-between shrink-0"
                        >
                          <span>Étag. E{shelfNum}</span>
                          <ScanLine className="w-3 h-3 text-amber-400" />
                        </button>

                        <div className="flex-1 flex items-stretch gap-1.5">
                          {rowBins.map((b) => {
                            const isSelected = b.id === activeBin.id;
                            const isDragOver = b.id === dragOverModalBinId;
                            const hasProd = b.product !== null;
                            const ratioPct = (
                              (b.widthRatio ?? 1 / Math.max(1, rowBins.length)) *
                              100
                            ).toFixed(1);
                            return (
                              <button
                                key={b.id}
                                type="button"
                                style={{ width: `${ratioPct}%` }}
                                draggable={hasProd}
                                onDragStart={() => setDraggedModalBinId(b.id)}
                                onDragOver={(e) => {
                                  e.preventDefault();
                                  setDragOverModalBinId(b.id);
                                }}
                                onDragLeave={() => setDragOverModalBinId(null)}
                                onDrop={(e) => {
                                  e.preventDefault();
                                  if (draggedModalBinId && draggedModalBinId !== b.id) {
                                    onSwapBins(draggedModalBinId, b.id);
                                    setFormFeedback(`Contenu transféré par glisser-déposer vers ${b.code}.`);
                                  }
                                  setDraggedModalBinId(null);
                                  setDragOverModalBinId(null);
                                }}
                                onClick={() => onSelectBin(cabinet.id, b.id)}
                                className={`p-2 rounded border text-left transition-colors ${
                                  isDragOver
                                    ? 'bg-emerald-500/25 border-emerald-400 text-white'
                                    : isSelected
                                    ? 'bg-amber-500/20 border-amber-400 text-white'
                                    : hasProd
                                    ? 'bg-[#0F172A] border-slate-700 text-slate-200 hover:border-slate-500 cursor-grab active:cursor-grabbing'
                                    : 'bg-slate-950/60 border-slate-800/80 text-slate-500 hover:border-slate-700'
                                }`}
                              >
                                <div className="flex items-center justify-between text-[10px] font-mono">
                                  <span>C{b.colIndex}</span>
                                  {b.product && (
                                    <span className="text-amber-400">
                                      x{b.product.quantity}
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] font-mono font-semibold truncate mt-0.5">
                                  {b.product ? b.product.reference : 'VIDE'}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Product Editor Form for activeBin */}
              <form
                onSubmit={handleSaveBinProduct}
                className="p-4 bg-[#0B1120] border border-slate-800 rounded-lg space-y-4"
              >
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-100">
                      Contenu de la Case{' '}
                      <span className="font-mono text-amber-400">
                        {activeBin.code}
                      </span>
                    </h3>
                    <p className="text-xs text-slate-400">
                      Étagère niveau {activeBin.shelfIndex} · Case colonne{' '}
                      {activeBin.colIndex}
                    </p>
                  </div>
                  {activeBin.product && (
                    <button
                      type="button"
                      onClick={() => {
                        onRemoveBinProduct(activeBin.id);
                        setFormFeedback(`Produit retiré de la case ${activeBin.code}.`);
                      }}
                      className="px-3 py-1.5 text-xs font-medium text-red-300 hover:text-white bg-red-950/60 hover:bg-red-900 border border-red-800/70 rounded-lg transition-colors flex items-center gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Vider la case</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label
                      htmlFor="bin-prod-ref"
                      className="block text-xs text-slate-300 mb-1"
                    >
                      Référence Produit (SKU)
                    </label>
                    <input
                      id="bin-prod-ref"
                      type="text"
                      required
                      value={prodRef}
                      onChange={(e) => setProdRef(e.target.value)}
                      placeholder="Ex: HYD-1040-PMP"
                      className="w-full px-3 py-2 text-xs font-mono bg-[#0F172A] border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="bin-prod-cat"
                      className="block text-xs text-slate-300 mb-1"
                    >
                      Catégorie Industrielle
                    </label>
                    <select
                      id="bin-prod-cat"
                      value={prodCategory}
                      onChange={(e) =>
                        setProdCategory(e.target.value as ProductCategory)
                      }
                      className="w-full px-3 py-2 text-xs bg-[#0F172A] border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-amber-500"
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label
                      htmlFor="bin-prod-name"
                      className="block text-xs text-slate-300 mb-1"
                    >
                      Désignation Complète de l&apos;Article
                    </label>
                    <input
                      id="bin-prod-name"
                      type="text"
                      required
                      value={prodName}
                      onChange={(e) => setProdName(e.target.value)}
                      placeholder="Ex: Pompe Hydraulique Axiale 310 Bar"
                      className="w-full px-3 py-2 text-xs bg-[#0F172A] border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="bin-prod-qty"
                      className="block text-xs text-slate-300 mb-1"
                    >
                      Quantité en Stock
                    </label>
                    <input
                      id="bin-prod-qty"
                      type="number"
                      min={0}
                      value={prodQty}
                      onChange={(e) => setProdQty(Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs font-mono tabular-nums bg-[#0F172A] border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="bin-prod-turnover"
                      className="block text-xs text-slate-300 mb-1"
                    >
                      Taux de Rotation (rotations/an)
                    </label>
                    <input
                      id="bin-prod-turnover"
                      type="number"
                      step="0.5"
                      min={0.5}
                      max={50}
                      value={prodTurnover}
                      onChange={(e) => setProdTurnover(Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs font-mono tabular-nums bg-[#0F172A] border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="bin-prod-packaging"
                      className="block text-xs text-slate-300 mb-1"
                    >
                      Type &amp; Gabarit d&apos;Emballage 3D
                    </label>
                    <select
                      id="bin-prod-packaging"
                      value={prodPackaging}
                      onChange={(e) =>
                        handlePackagingPresetChange(
                          e.target.value as PackagingType
                        )
                      }
                      className="w-full px-3 py-2 text-xs bg-[#0F172A] border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-amber-500"
                    >
                      {PACKAGING_TYPES.map((pk) => (
                        <option key={pk} value={pk}>
                          {pk}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="bin-prod-min"
                      className="block text-xs text-slate-300 mb-1"
                    >
                      Seuil d&apos;Alerte Minimum
                    </label>
                    <input
                      id="bin-prod-min"
                      type="number"
                      min={1}
                      value={prodMinThreshold}
                      onChange={(e) =>
                        setProdMinThreshold(Number(e.target.value))
                      }
                      className="w-full px-3 py-2 text-xs font-mono tabular-nums bg-[#0F172A] border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                {/* Packaging Dimensions L x l x H cm */}
                <div className="pt-2 border-t border-slate-800/80">
                  <div className="text-xs font-medium text-slate-300 mb-2">
                    Dimensions d&apos;Emballage de la Référence (L × l × H en cm &amp; Poids)
                  </div>
                  <div className="grid grid-cols-4 gap-2.5">
                    <div>
                      <label className="block text-[11px] text-slate-400">
                        Longueur (cm)
                      </label>
                      <input
                        type="number"
                        step="any"
                        min={0.1}
                        value={prodLengthCm}
                        onChange={(e) => setProdLengthCm(Number(e.target.value))}
                        className="w-full mt-0.5 px-2.5 py-1.5 text-xs font-mono tabular-nums bg-[#0F172A] border border-slate-700 rounded text-slate-100"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-400">
                        Largeur (cm)
                      </label>
                      <input
                        type="number"
                        step="any"
                        min={0.1}
                        value={prodWidthCm}
                        onChange={(e) => setProdWidthCm(Number(e.target.value))}
                        className="w-full mt-0.5 px-2.5 py-1.5 text-xs font-mono tabular-nums bg-[#0F172A] border border-slate-700 rounded text-slate-100"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-400">
                        Hauteur (cm)
                      </label>
                      <input
                        type="number"
                        step="any"
                        min={0.1}
                        value={prodHeightCm}
                        onChange={(e) => setProdHeightCm(Number(e.target.value))}
                        className="w-full mt-0.5 px-2.5 py-1.5 text-xs font-mono tabular-nums bg-[#0F172A] border border-slate-700 rounded text-slate-100"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-400">
                        Poids (kg)
                      </label>
                      <input
                        type="number"
                        step="any"
                        min={0.01}
                        value={prodWeightKg}
                        onChange={(e) => setProdWeightKg(Number(e.target.value))}
                        className="w-full mt-0.5 px-2.5 py-1.5 text-xs font-mono tabular-nums bg-[#0F172A] border border-slate-700 rounded text-slate-100"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>
                      {activeBin.product
                        ? 'Enregistrer les Modifications du Produit'
                        : 'Affecter ce Produit à la Case'}
                    </span>
                  </button>
                </div>
              </form>
            </>
          )}

          {/* Cabinet Structure & 3D Placement Tab */}
          {(activeTab === 'cabinet' || mode === 'create-cabinet') && (
            <form
              onSubmit={handleSaveCabinetStructure}
              className="p-4 bg-[#0B1120] border border-slate-800 rounded-lg space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-sm font-semibold text-slate-100">
                    Paramètres d&apos;Architecture de l&apos;Armoire 3D
                  </h3>
                  <p className="text-xs text-slate-400">
                    Modifiez le nombre d&apos;étagères, de cases par niveau et l&apos;implantation dans la salle de stock.
                  </p>
                </div>
                {mode !== 'create-cabinet' && cabinet && (
                  <button
                    type="button"
                    onClick={() => {
                      onDeleteCabinet(cabinet.id);
                      onClose();
                    }}
                    className="px-3 py-1.5 text-xs font-medium text-red-300 hover:text-white bg-red-950/60 hover:bg-red-900 border border-red-800/70 rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Supprimer l&apos;Armoire</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label
                    htmlFor="cab-code-input"
                    className="block text-xs text-slate-300 mb-1"
                  >
                    Code Armoire
                  </label>
                  <input
                    id="cab-code-input"
                    type="text"
                    required
                    value={cabCode}
                    onChange={(e) => setCabCode(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono bg-[#0F172A] border border-slate-700 rounded-lg text-slate-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor="cab-zone-input"
                    className="block text-xs text-slate-300 mb-1"
                  >
                    Zone de l&apos;Entrepôt
                  </label>
                  <input
                    id="cab-zone-input"
                    type="text"
                    required
                    value={cabZone}
                    onChange={(e) => setCabZone(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-[#0F172A] border border-slate-700 rounded-lg text-slate-100"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label
                    htmlFor="cab-name-input"
                    className="block text-xs text-slate-300 mb-1"
                  >
                    Intitulé de l&apos;Armoire
                  </label>
                  <input
                    id="cab-name-input"
                    type="text"
                    required
                    value={cabName}
                    onChange={(e) => setCabName(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-[#0F172A] border border-slate-700 rounded-lg text-slate-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor="cab-shelves-input"
                    className="block text-xs text-slate-300 mb-1"
                  >
                    Nombre d&apos;Étagères
                  </label>
                  <input
                    id="cab-shelves-input"
                    type="number"
                    min={1}
                    value={cabShelves}
                    onChange={(e) => setCabShelves(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs font-mono tabular-nums bg-[#0F172A] border border-slate-700 rounded-lg text-slate-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor="cab-cols-input"
                    className="block text-xs text-slate-300 mb-1"
                  >
                    Nombre de Cases par Étagère
                  </label>
                  <input
                    id="cab-cols-input"
                    type="number"
                    min={1}
                    value={cabCols}
                    onChange={(e) => setCabCols(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs font-mono tabular-nums bg-[#0F172A] border border-slate-700 rounded-lg text-slate-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor="cab-posx-input"
                    className="block text-xs text-slate-300 mb-1"
                  >
                    Position Sol X (mètres)
                  </label>
                  <input
                    id="cab-posx-input"
                    type="number"
                    step="any"
                    value={cabPosX}
                    onChange={(e) => setCabPosX(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs font-mono tabular-nums bg-[#0F172A] border border-slate-700 rounded-lg text-slate-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor="cab-posz-input"
                    className="block text-xs text-slate-300 mb-1"
                  >
                    Position Sol Z (mètres)
                  </label>
                  <input
                    id="cab-posz-input"
                    type="number"
                    step="any"
                    value={cabPosZ}
                    onChange={(e) => setCabPosZ(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs font-mono tabular-nums bg-[#0F172A] border border-slate-700 rounded-lg text-slate-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor="cab-rot-input"
                    className="block text-xs text-slate-300 mb-1"
                  >
                    Orientation 3D (Degrés)
                  </label>
                  <select
                    id="cab-rot-input"
                    value={cabRotY}
                    onChange={(e) => setCabRotY(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs font-mono bg-[#0F172A] border border-slate-700 rounded-lg text-slate-100"
                  >
                    <option value={0}>0° (Orientée Sud)</option>
                    <option value={90}>90° (Orientée Est)</option>
                    <option value={180}>180° (Orientée Nord)</option>
                    <option value={270}>270° (Orientée Ouest)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-slate-300 mb-1">
                    Couleur des Lisses d&apos;Étagères
                  </label>
                  <div className="flex items-center gap-2 pt-1">
                    {[
                      '#f59e0b',
                      '#06b6d4',
                      '#10b981',
                      '#6366f1',
                      '#ec4899',
                      '#f97316',
                    ].map((hex) => (
                      <button
                        key={hex}
                        type="button"
                        aria-label={`Choisir couleur ${hex}`}
                        onClick={() => setCabColor(hex)}
                        className={`w-6 h-6 rounded-md border ${
                          cabColor === hex
                            ? 'border-white scale-110'
                            : 'border-transparent opacity-75'
                        }`}
                        style={{ backgroundColor: hex }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                <span className="text-xs text-slate-400 font-mono">
                  Capacité totale : {cabShelves * cabCols} cases
                </span>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg transition-colors flex items-center gap-2 cursor-pointer"
                >
                  {mode === 'create-cabinet' ? (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>Créer l&apos;Armoire en 3D</span>
                    </>
                  ) : (
                    <>
                      <ArrowUpDown className="w-4 h-4" />
                      <span>Appliquer à l&apos;Armoire 3D</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
