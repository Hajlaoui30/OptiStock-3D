/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import {
  Plus,
  Edit3,
  MapPin,
  X,
  Grid,
} from 'lucide-react';
import {
  Cabinet,
  ColorMode3D,
  ScannedShelfItem,
  ProductItem,
  RoomDimensions,
  SiemensExcelProductRow,
  DEFAULT_ROOM_DIMENSIONS,
  createInitialWarehouseCabinets,
  createCabinet,
  updateCabinetStructure,
  deleteCabinet,
  addBinToShelf,
  removeBinFromShelf,
  resizeShelfBinDivider,
  setShelfBinWidthCm,
  applyShelfPresetLayout,
  updateShelfHeightCm,
  autoOrganizeSiemensProductsInCabinet,
  getShelfBinsWithGeometry,
  upsertBinProduct,
  removeBinProduct,
  moveOrSwapBins,
  adjustBinQuantity,
  associateScannedItemsToCabinetShelf,
  computeWarehouseAnalytics,
  generateSlottingRecommendations,
  applySlottingRecommendations,
  searchWarehouseBins,
} from './utils/warehouseLogic';
import { Warehouse3DCanvas, CameraPreset } from './components/Warehouse3DCanvas';
import { BottomControlDock } from './components/BottomControlDock';
import { AIShelfScannerModal } from './components/AIShelfScannerModal';
import { CabinetBinInspectorModal } from './components/CabinetBinInspectorModal';
import { CatalogAndAnalyticsViews } from './components/CatalogAndAnalyticsViews';
import { FloorPlan2DDesigner } from './components/FloorPlan2DDesigner';

type ActiveOverlay =
  | 'none'
  | 'plan2d'
  | 'scanner'
  | 'inspector'
  | 'create-cabinet'
  | 'catalog'
  | 'analytics'
  | 'optimize';

const STORAGE_KEY = 'optistock_3d_siemens_v2';
const ROOM_STORAGE_KEY = 'optistock_3d_room_v3';

export default function App() {
  const [cabinets, setCabinets] = useState<Cabinet[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // ignore storage errors
    }
    return createInitialWarehouseCabinets();
  });

  const [roomDimensions, setRoomDimensions] = useState<RoomDimensions>(() => {
    try {
      const saved = localStorage.getItem(ROOM_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (
          parsed &&
          typeof parsed.widthMeters === 'number' &&
          typeof parsed.depthMeters === 'number'
        ) {
          return parsed;
        }
      }
    } catch {
      // ignore storage errors
    }
    return DEFAULT_ROOM_DIMENSIONS;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cabinets));
    } catch {
      // ignore storage errors
    }
  }, [cabinets]);

  useEffect(() => {
    try {
      localStorage.setItem(ROOM_STORAGE_KEY, JSON.stringify(roomDimensions));
    } catch {
      // ignore storage errors
    }
  }, [roomDimensions]);

  const [selectedCabinetId, setSelectedCabinetId] = useState<string | null>(
    cabinets[0]?.id ?? null
  );
  const [selectedBinId, setSelectedBinId] = useState<string | null>(
    cabinets[0]?.bins[0]?.id ?? null
  );
  const [scannerTargetShelf, setScannerTargetShelf] = useState<number>(2);

  const [activeOverlay, setActiveOverlay] = useState<ActiveOverlay>('none');
  const [isDockCollapsed, setIsDockCollapsed] = useState<boolean>(false);
  const [quickSearch, setQuickSearch] = useState<string>('');
  const [colorMode, setColorMode] = useState<ColorMode3D>('standard');
  const [shelfExplodeFactor, setShelfExplodeFactor] = useState<number>(0);
  const [cameraPreset, setCameraPreset] = useState<CameraPreset>('overview');
  const [cameraPresetTrigger, setCameraPresetTrigger] = useState<number>(0);
  const [toastNotification, setToastNotification] = useState<string | null>(
    null
  );

  const triggerToast = (msg: string) => {
    setToastNotification(msg);
    window.setTimeout(() => {
      setToastNotification((prev) => (prev === msg ? null : prev));
    }, 4500);
  };

  // Compute real-time analytics and AI slotting recommendations
  const analytics = useMemo(
    () => computeWarehouseAnalytics(cabinets),
    [cabinets]
  );
  const recommendations = useMemo(
    () => generateSlottingRecommendations(cabinets),
    [cabinets]
  );

  // Highlighted bins from quick search
  const matchedSearchBins = useMemo(() => {
    if (!quickSearch.trim()) return [];
    return searchWarehouseBins(cabinets, quickSearch);
  }, [cabinets, quickSearch]);

  const highlightedBinIds = useMemo(
    () => new Set(matchedSearchBins.map((b) => b.id)),
    [matchedSearchBins]
  );

  useEffect(() => {
    if (matchedSearchBins.length > 0 && quickSearch.trim().length >= 2) {
      const first = matchedSearchBins[0];
      setSelectedCabinetId(first.cabinetId);
      setSelectedBinId(first.id);
    }
  }, [quickSearch]);

  const selectedCabinet = useMemo(
    () => cabinets.find((c) => c.id === selectedCabinetId) || cabinets[0] || null,
    [cabinets, selectedCabinetId]
  );

  const selectedBin = useMemo(
    () =>
      selectedCabinet?.bins.find((b) => b.id === selectedBinId) ||
      selectedCabinet?.bins[0] ||
      null,
    [selectedCabinet, selectedBinId]
  );

  const selectedBinGeometry = useMemo(() => {
    if (!selectedCabinet || !selectedBin) return null;
    return (
      getShelfBinsWithGeometry(selectedCabinet, selectedBin.shelfIndex).find(
        (g) => g.bin.id === selectedBin.id
      ) || null
    );
  }, [selectedCabinet, selectedBin]);

  const handleSelectBinFrom3D = (cabinetId: string, binId: string) => {
    setSelectedCabinetId(cabinetId);
    setSelectedBinId(binId);
  };

  const handleSelectCabinetFrom3D = (cabinetId: string) => {
    setSelectedCabinetId(cabinetId);
    const cab = cabinets.find((c) => c.id === cabinetId);
    if (cab && cab.bins.length > 0) {
      setSelectedBinId(cab.bins[0].id);
    }
  };

  const handleCreateCabinet = (params: {
    code: string;
    name: string;
    zone: string;
    position: { x: number; z: number };
    rotationY: number;
    shelvesCount: number;
    columnsCount: number;
    depthMeters?: number;
    accentColor: string;
  }) => {
    const newCab = createCabinet(params);
    setCabinets((prev) => [...prev, newCab]);
    setSelectedCabinetId(newCab.id);
    setSelectedBinId(newCab.bins[0]?.id ?? null);
    triggerToast(
      `Nouvelle armoire ${newCab.code} (${newCab.bins.length} cases) ajoutée.`
    );
  };

  const handleInsertCabinetFrom2D = (newCab: Cabinet) => {
    setCabinets((prev) => [...prev, newCab]);
    setSelectedCabinetId(newCab.id);
    setSelectedBinId(newCab.bins[0]?.id ?? null);
    triggerToast(
      `Armoire ${newCab.code} (${newCab.bins.length} cases inégales) insérée sur le Plan 2D.`
    );
  };

  const handleUpdateCabinet = (
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
  ) => {
    setCabinets((prev) => updateCabinetStructure(prev, cabinetId, updates));
  };

  const handleDeleteCabinet = (cabinetId: string) => {
    setCabinets((prev) => {
      const next = deleteCabinet(prev, cabinetId);
      if (selectedCabinetId === cabinetId) {
        setSelectedCabinetId(next[0]?.id ?? null);
        setSelectedBinId(next[0]?.bins[0]?.id ?? null);
      }
      return next;
    });
    triggerToast('Armoire supprimée du plan 2D et de l’entrepôt 3D.');
  };

  const handleAddBinToShelf = (cabinetId: string, shelfIndex: number) => {
    setCabinets((prev) => addBinToShelf(prev, cabinetId, shelfIndex));
  };

  const handleRemoveBinFromShelf = (
    cabinetId: string,
    shelfIndex: number,
    binId?: string
  ) => {
    setCabinets((prev) => removeBinFromShelf(prev, cabinetId, shelfIndex, binId));
  };

  const handleResizeShelfDivider = (
    cabinetId: string,
    shelfIndex: number,
    leftColIndex: number,
    deltaRatio: number
  ) => {
    setCabinets((prev) =>
      resizeShelfBinDivider(prev, cabinetId, shelfIndex, leftColIndex, deltaRatio)
    );
  };

  const handleSetBinWidthCm = (binId: string, targetWidthCm: number) => {
    setCabinets((prev) => setShelfBinWidthCm(prev, binId, targetWidthCm));
  };

  const handleApplyShelfPreset = (
    cabinetId: string,
    shelfIndex: number,
    ratios: number[]
  ) => {
    setCabinets((prev) =>
      applyShelfPresetLayout(prev, cabinetId, shelfIndex, ratios)
    );
  };

  const handleUpdateShelfHeightCm = (
    cabinetId: string,
    shelfIndex: number,
    heightCm: number
  ) => {
    setCabinets((prev) =>
      updateShelfHeightCm(prev, cabinetId, shelfIndex, heightCm)
    );
  };

  const handleAutoOrganizeSiemensCabinet = (
    cabinetId: string,
    products: SiemensExcelProductRow[]
  ) => {
    const { updatedCabinets, placedCount } =
      autoOrganizeSiemensProductsInCabinet(cabinets, cabinetId, products);
    setCabinets(updatedCabinets);
    triggerToast(
      `Organisation 2D terminée : ${placedCount} références Siemens rangées avec cases sur mesure.`
    );
  };

  const handleUpsertBinProduct = (
    binId: string,
    productInput: Omit<ProductItem, 'id' | 'lastUpdated'>
  ) => {
    setCabinets((prev) => upsertBinProduct(prev, binId, productInput));
  };

  const handleRemoveBinProduct = (binId: string) => {
    setCabinets((prev) => removeBinProduct(prev, binId));
  };

  const handleSwapBins = (sourceBinId: string, targetBinId: string) => {
    setCabinets((prev) => moveOrSwapBins(prev, sourceBinId, targetBinId));
    setSelectedBinId(targetBinId);
    triggerToast('Emplacement des cases permuté par Glisser-Déposer (Drag & Drop).');
  };

  const handleAdjustQuantity = (binId: string, delta: number) => {
    setCabinets((prev) => adjustBinQuantity(prev, binId, delta));
  };

  const handleAssociateScannedItems = (
    cabinetId: string,
    shelfIndex: number,
    items: ScannedShelfItem[]
  ) => {
    const { updatedCabinets, assignedBinCodes } =
      associateScannedItemsToCabinetShelf(cabinets, cabinetId, shelfIndex, items);
    setCabinets(updatedCabinets);
    setSelectedCabinetId(cabinetId);
    const updatedCab = updatedCabinets.find((c) => c.id === cabinetId);
    const firstUpdatedBin = updatedCab?.bins.find(
      (b) => b.shelfIndex === shelfIndex && b.colIndex === 1
    );
    if (firstUpdatedBin) {
      setSelectedBinId(firstUpdatedBin.id);
    }
    triggerToast(
      `Scan IA Siemens terminé : ${assignedBinCodes.length} cases mises à jour (${assignedBinCodes.join(', ')}).`
    );
  };

  const handleApplySlottingRecommendations = () => {
    if (recommendations.length === 0) return;
    setCabinets((prev) => applySlottingRecommendations(prev, recommendations));
    triggerToast(
      `Optimisation IA appliquée : ${recommendations.length} références Siemens à haute rotation repositionnées.`
    );
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#0B1120] select-none">
      {/* 1. Strict 3-Zone Top Navigation Bar Contract */}
      <header className="fixed top-0 left-0 right-0 z-30 flex items-center justify-between gap-8 px-6 py-3.5 bg-[#0B1120] border-b border-slate-800">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="#entrepot"
          onClick={(e) => {
            e.preventDefault();
            setActiveOverlay('none');
          }}
          className="text-lg font-bold tracking-tight text-slate-100 font-display whitespace-nowrap shrink-0"
        >
          OptiStock 3D
        </a>

        {/* Zone 2: 5 concise single-line navigation links */}
        <nav
          aria-label="Navigation principale"
          className="flex items-center gap-6 text-sm font-medium text-slate-300 overflow-x-auto"
        >
          <a
            href="#plan-2d"
            onClick={(e) => {
              e.preventDefault();
              setActiveOverlay('plan2d');
            }}
            className={`hover:text-white transition-colors whitespace-nowrap shrink-0 ${
              activeOverlay === 'plan2d'
                ? 'text-amber-400 underline underline-offset-8 decoration-2'
                : ''
            }`}
          >
            Plan 2D &amp; Excel Siemens
          </a>
          <a
            href="#entrepot-3d"
            onClick={(e) => {
              e.preventDefault();
              setActiveOverlay('none');
            }}
            className={`hover:text-white transition-colors whitespace-nowrap shrink-0 ${
              activeOverlay === 'none'
                ? 'text-amber-400 underline underline-offset-8 decoration-2'
                : ''
            }`}
          >
            Entrepôt 3D
          </a>
          <a
            href="#scanner-ia"
            onClick={(e) => {
              e.preventDefault();
              setScannerTargetShelf(selectedBin?.shelfIndex || 2);
              setActiveOverlay('scanner');
            }}
            className={`hover:text-white transition-colors whitespace-nowrap shrink-0 ${
              activeOverlay === 'scanner'
                ? 'text-amber-400 underline underline-offset-8 decoration-2'
                : ''
            }`}
          >
            Scanner IA
          </a>
          <a
            href="#catalogue"
            onClick={(e) => {
              e.preventDefault();
              setActiveOverlay('catalog');
            }}
            className={`hover:text-white transition-colors whitespace-nowrap shrink-0 ${
              activeOverlay === 'catalog'
                ? 'text-amber-400 underline underline-offset-8 decoration-2'
                : ''
            }`}
          >
            Catalogue Siemens
          </a>
          <a
            href="#analytique"
            onClick={(e) => {
              e.preventDefault();
              setActiveOverlay('analytics');
            }}
            className={`hover:text-white transition-colors whitespace-nowrap shrink-0 ${
              activeOverlay === 'analytics' || activeOverlay === 'optimize'
                ? 'text-amber-400 underline underline-offset-8 decoration-2'
                : ''
            }`}
          >
            Analytique &amp; IA
          </a>
        </nav>

        {/* Zone 3: 1 primary action (Opens 2D Studio + Unequal Cases + Siemens Excel) */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={() => setActiveOverlay('plan2d')}
            className="px-4 py-2 text-xs font-semibold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Configurer en 2D (Armoires &amp; Cases)</span>
          </button>
        </div>
      </header>

      {/* 2. Full-Viewport 3D Three.js Scene */}
      <main className="w-full h-full">
        <Warehouse3DCanvas
          cabinets={cabinets}
          roomDimensions={roomDimensions}
          selectedCabinetId={selectedCabinet?.id ?? null}
          selectedBinId={selectedBin?.id ?? null}
          highlightedBinIds={highlightedBinIds}
          colorMode={colorMode}
          shelfExplodeFactor={shelfExplodeFactor}
          cameraPreset={cameraPreset}
          cameraPresetTrigger={cameraPresetTrigger}
          onSelectBin={handleSelectBinFrom3D}
          onSelectCabinet={handleSelectCabinetFrom3D}
        />

        {/* Compact Top-Left Active Bin / Cabinet Selection Spec Card */}
        {selectedCabinet && selectedBin && activeOverlay === 'none' && (
          <section
            aria-label="Emplacement 3D sélectionné"
            className="fixed top-18 left-5 z-20 w-92 bg-[#0F172A] border border-slate-800 rounded-xl p-4 shadow-xl space-y-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-[11px] font-mono text-amber-400 truncate">
                  {selectedCabinet.code} · E{selectedBin.shelfIndex} · Case C
                  {selectedBin.colIndex} (
                  {selectedBinGeometry
                    ? `${selectedBinGeometry.widthCm}×${selectedBinGeometry.shelfHeightCm}cm`
                    : 'Sur mesure'}
                  )
                </div>
                <h1 className="text-sm font-bold text-slate-100 font-display mt-0.5 truncate">
                  {selectedBin.product
                    ? selectedBin.product.name
                    : 'Case Disponible (Vide)'}
                </h1>
              </div>
              <span className="text-xs font-mono font-bold text-slate-300 whitespace-nowrap shrink-0">
                {selectedBin.code}
              </span>
            </div>

            {selectedBin.product ? (
              <div className="text-xs text-slate-300 space-y-1.5 border-t border-slate-800 pt-2.5">
                <div className="flex items-center justify-between gap-2 font-mono">
                  <span className="text-slate-400 whitespace-nowrap">
                    Réf. Siemens (MLFB) :
                  </span>
                  <span className="font-bold text-amber-300 whitespace-nowrap">
                    {selectedBin.product.reference}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2 font-mono tabular-nums">
                  <span className="text-slate-400 whitespace-nowrap">
                    Stock &amp; Rotation :
                  </span>
                  <span className="whitespace-nowrap">
                    <strong>{selectedBin.product.quantity}</strong> pcs ·{' '}
                    <span className="text-emerald-400">
                      {selectedBin.product.turnoverRate} rot./an
                    </span>
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2 font-mono tabular-nums">
                  <span className="text-slate-400 whitespace-nowrap">
                    Dim. Produit vs Case :
                  </span>
                  <span className="text-slate-200 whitespace-nowrap">
                    {selectedBin.product.dimensionsCm.lengthCm}×
                    {selectedBin.product.dimensionsCm.widthCm}×
                    {selectedBin.product.dimensionsCm.heightCm} cm (Case{' '}
                    {selectedBinGeometry?.widthCm ?? 85}cm)
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400 border-t border-slate-800 pt-2.5">
                Case de largeur {selectedBinGeometry?.widthCm ?? 85} cm sur
                l&apos;étagère E{selectedBin.shelfIndex}. Glissez un produit Siemens en 2D ou scannez l&apos;étagère.
              </p>
            )}

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => setActiveOverlay('plan2d')}
                className="px-3 py-2 text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer"
              >
                <Grid className="w-3.5 h-3.5" />
                <span>Organiser Cases en 2D</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveOverlay('inspector')}
                className="px-3 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 rounded-lg transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                <span>Éditer Référence</span>
              </button>
            </div>
          </section>
        )}

        {/* Toast Feedback Banner */}
        {toastNotification && (
          <div
            role="status"
            className="fixed top-18 right-5 z-50 max-w-md bg-[#0F172A] border border-amber-500/50 text-slate-100 px-4 py-3 rounded-xl shadow-2xl flex items-center justify-between gap-3 text-xs"
          >
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{toastNotification}</span>
            </div>
            <button
              type="button"
              aria-label="Fermer la notification"
              onClick={() => setToastNotification(null)}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* 3. Unified Collapsible Bottom Control Dock */}
        <BottomControlDock
          isCollapsed={isDockCollapsed}
          onToggleCollapse={() => setIsDockCollapsed((prev) => !prev)}
          cabinets={cabinets}
          selectedCabinetId={selectedCabinet?.id ?? null}
          onSelectCabinet={handleSelectCabinetFrom3D}
          quickSearch={quickSearch}
          onQuickSearchChange={setQuickSearch}
          searchMatchesCount={matchedSearchBins.length}
          colorMode={colorMode}
          onColorModeChange={setColorMode}
          shelfExplodeFactor={shelfExplodeFactor}
          onShelfExplodeChange={setShelfExplodeFactor}
          cameraPreset={cameraPreset}
          onSelectCameraPreset={(preset) => {
            setCameraPreset(preset);
            setCameraPresetTrigger((t) => t + 1);
          }}
          onOpenScannerForActiveCabinet={() => {
            setScannerTargetShelf(selectedBin?.shelfIndex || 2);
            setActiveOverlay('scanner');
          }}
        />
      </main>

      {/* 4. 2D Top-Down Floor Plan + Unequal Shelf Cases + Siemens Excel Organizer */}
      {activeOverlay === 'plan2d' && (
        <FloorPlan2DDesigner
          cabinets={cabinets}
          roomDimensions={roomDimensions}
          selectedCabinetId={selectedCabinet?.id ?? null}
          selectedBinId={selectedBin?.id ?? null}
          onSelectCabinet={handleSelectCabinetFrom3D}
          onSelectBin={handleSelectBinFrom3D}
          onUpdateRoomDimensions={(updates) =>
            setRoomDimensions((prev) => ({ ...prev, ...updates }))
          }
          onAddCabinet={handleInsertCabinetFrom2D}
          onUpdateCabinet={handleUpdateCabinet}
          onDeleteCabinet={handleDeleteCabinet}
          onAddBinToShelf={handleAddBinToShelf}
          onRemoveBinFromShelf={handleRemoveBinFromShelf}
          onResizeShelfDivider={handleResizeShelfDivider}
          onSetBinWidthCm={handleSetBinWidthCm}
          onApplyShelfPreset={handleApplyShelfPreset}
          onUpdateShelfHeightCm={handleUpdateShelfHeightCm}
          onAutoOrganizeSiemensCabinet={handleAutoOrganizeSiemensCabinet}
          onSwapBins={handleSwapBins}
          onUpsertBinProduct={handleUpsertBinProduct}
          onOpenDetailedInspector={() => setActiveOverlay('inspector')}
          onOpenAIScanner={(cabId, shelfIdx) => {
            setSelectedCabinetId(cabId);
            setScannerTargetShelf(shelfIdx);
            setActiveOverlay('scanner');
          }}
          onSwitchTo3D={() => setActiveOverlay('none')}
        />
      )}

      {/* 5. Other Modals & Drawers */}
      {activeOverlay === 'scanner' && (
        <AIShelfScannerModal
          cabinets={cabinets}
          initialCabinetId={selectedCabinet?.id ?? null}
          initialShelfIndex={scannerTargetShelf}
          onClose={() => setActiveOverlay('none')}
          onAssociateItems={handleAssociateScannedItems}
        />
      )}

      {(activeOverlay === 'inspector' ||
        activeOverlay === 'create-cabinet') && (
        <CabinetBinInspectorModal
          mode={
            activeOverlay === 'create-cabinet' ? 'create-cabinet' : 'inspect'
          }
          cabinet={selectedCabinet}
          selectedBinId={selectedBin?.id ?? null}
          onSelectBin={handleSelectBinFrom3D}
          onClose={() => setActiveOverlay('none')}
          onCreateCabinet={handleCreateCabinet}
          onUpdateCabinet={handleUpdateCabinet}
          onDeleteCabinet={handleDeleteCabinet}
          onUpsertBinProduct={handleUpsertBinProduct}
          onRemoveBinProduct={handleRemoveBinProduct}
          onSwapBins={handleSwapBins}
          onOpenShelfScanner={(cabId, shelfIdx) => {
            setSelectedCabinetId(cabId);
            setScannerTargetShelf(shelfIdx);
            setActiveOverlay('scanner');
          }}
        />
      )}

      {(activeOverlay === 'catalog' ||
        activeOverlay === 'analytics' ||
        activeOverlay === 'optimize') && (
        <CatalogAndAnalyticsViews
          activeModal={activeOverlay}
          cabinets={cabinets}
          analytics={analytics}
          recommendations={recommendations}
          onClose={() => setActiveOverlay('none')}
          onLocateBinIn3D={(cabId, binId) => {
            setSelectedCabinetId(cabId);
            setSelectedBinId(binId);
          }}
          onAdjustQuantity={handleAdjustQuantity}
          onApplyRecommendations={handleApplySlottingRecommendations}
          onSwitch3DColorMode={(mode) => setColorMode(mode)}
        />
      )}
    </div>
  );
}
