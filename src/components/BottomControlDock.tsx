import React from 'react';
import {
  ChevronDown,
  ChevronUp,
  Search,
  Eye,
  Sliders,
  Compass,
  ScanLine,
} from 'lucide-react';
import { Cabinet, ColorMode3D } from '../utils/warehouseLogic';
import { CameraPreset } from './Warehouse3DCanvas';

interface BottomControlDockProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  cabinets: Cabinet[];
  selectedCabinetId: string | null;
  onSelectCabinet: (cabinetId: string) => void;
  quickSearch: string;
  onQuickSearchChange: (val: string) => void;
  searchMatchesCount: number;
  colorMode: ColorMode3D;
  onColorModeChange: (mode: ColorMode3D) => void;
  shelfExplodeFactor: number;
  onShelfExplodeChange: (val: number) => void;
  cameraPreset: CameraPreset;
  onSelectCameraPreset: (preset: CameraPreset) => void;
  onOpenScannerForActiveCabinet: () => void;
}

export const BottomControlDock: React.FC<BottomControlDockProps> = ({
  isCollapsed,
  onToggleCollapse,
  cabinets,
  selectedCabinetId,
  onSelectCabinet,
  quickSearch,
  onQuickSearchChange,
  searchMatchesCount,
  colorMode,
  onColorModeChange,
  shelfExplodeFactor,
  onShelfExplodeChange,
  cameraPreset,
  onSelectCameraPreset,
  onOpenScannerForActiveCabinet,
}) => {
  return (
    <div
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-20 w-full max-w-[min(940px,94vw)] pointer-events-none flex flex-col items-center"
      aria-label="Barre de contrôle de la scène 3D"
    >
      {/* Collapse / Expand Toggle Button */}
      <button
        type="button"
        onClick={onToggleCollapse}
        className="pointer-events-auto px-3.5 py-1 text-xs font-medium bg-[#0F172A] hover:bg-slate-800 text-slate-300 border border-slate-700 border-b-0 rounded-t-lg flex items-center gap-1.5 transition-colors cursor-pointer"
      >
        {isCollapsed ? (
          <>
            <ChevronUp className="w-3.5 h-3.5 text-amber-400" />
            <span>Afficher Contrôles 3D</span>
          </>
        ) : (
          <>
            <ChevronDown className="w-3.5 h-3.5 text-amber-400" />
            <span>Masquer Contrôles</span>
          </>
        )}
      </button>

      {/* Main Dock Panel */}
      {!isCollapsed && (
        <div className="pointer-events-auto w-full bg-[#0F172A] border border-slate-800 rounded-xl shadow-2xl p-3 space-y-2.5">
          {/* Row 1: Fast Search in 3D + Cabinet Direct Selector + Quick AI Scan */}
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[210px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={quickSearch}
                onChange={(e) => onQuickSearchChange(e.target.value)}
                placeholder="Recherche rapide 3D (réf. HYD-1040, pompe, ARM-A1)..."
                aria-label="Recherche rapide de référence dans l'entrepôt 3D"
                className="w-full pl-8 pr-16 py-1.5 text-xs bg-[#0B1120] border border-slate-700 rounded-lg text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
              />
              {quickSearch.trim() !== '' && (
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] font-mono text-cyan-400">
                  {searchMatchesCount} réf.
                </span>
              )}
            </div>

            {/* Cabinet Quick Buttons */}
            <div className="flex items-center gap-1 bg-[#0B1120] p-1 rounded-lg border border-slate-800 overflow-x-auto">
              {cabinets.map((cab) => (
                <button
                  key={cab.id}
                  type="button"
                  onClick={() => onSelectCabinet(cab.id)}
                  className={`px-2.5 py-1 text-xs font-mono rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    selectedCabinetId === cab.id
                      ? 'bg-amber-500 text-slate-950 font-bold'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  {cab.code}
                </button>
              ))}
            </div>

            {/* Direct AI Shelf Scan Trigger */}
            <button
              type="button"
              onClick={onOpenScannerForActiveCabinet}
              className="px-3 py-1.5 text-xs font-semibold bg-amber-500/15 hover:bg-amber-500 text-amber-300 hover:text-slate-950 border border-amber-500/40 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <ScanLine className="w-3.5 h-3.5" />
              <span>Scanner Partie d&apos;Armoire IA</span>
            </button>
          </div>

          {/* Row 2: Camera Presets | 3D Color Mode (Standard / Rotation / Occupancy) | Exploded Shelf Slider */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/80 text-xs">
            {/* Camera Presets */}
            <div className="flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <div className="flex items-center gap-1 bg-[#0B1120] p-0.5 rounded-lg border border-slate-800">
                {(
                  [
                    { id: 'overview', label: 'Vue Globale' },
                    { id: 'aisle', label: 'Allée Centrale' },
                    { id: 'dock', label: 'Vue Frontale' },
                    { id: 'top', label: 'Vue Plan 2D/3D' },
                  ] as Array<{ id: CameraPreset; label: string }>
                ).map((cam) => (
                  <button
                    key={cam.id}
                    type="button"
                    onClick={() => onSelectCameraPreset(cam.id)}
                    className={`px-2.5 py-1 text-[11px] font-medium rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      cameraPreset === cam.id
                        ? 'bg-slate-800 text-white font-semibold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {cam.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 3D Color Mode */}
            <div className="flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <div className="flex items-center gap-1 bg-[#0B1120] p-0.5 rounded-lg border border-slate-800">
                {(
                  [
                    { id: 'standard', label: 'Emballages' },
                    { id: 'rotation', label: 'Thermique Rotation' },
                    { id: 'occupancy', label: 'Alertes Stock' },
                  ] as Array<{ id: ColorMode3D; label: string }>
                ).map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => onColorModeChange(m.id)}
                    className={`px-2.5 py-1 text-[11px] font-medium rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      colorMode === m.id
                        ? 'bg-amber-500 text-slate-950 font-semibold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Exploded Shelf View Slider */}
            <div className="flex items-center gap-2">
              <Sliders className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <label
                htmlFor="explode-shelves-slider"
                className="text-[11px] text-slate-400 whitespace-nowrap"
              >
                Écartement Étagères
              </label>
              <input
                id="explode-shelves-slider"
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={shelfExplodeFactor}
                onChange={(e) => onShelfExplodeChange(Number(e.target.value))}
                className="w-24 accent-amber-500 cursor-pointer"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
