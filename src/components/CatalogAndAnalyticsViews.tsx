import React, { useState, useEffect } from 'react';
import {
  Search,
  Navigation,
  Sparkles,
  BarChart3,
  Package,
  ArrowRightLeft,
  CheckCircle2,
  X,
  Plus,
  Minus,
  AlertTriangle,
  Flame,
} from 'lucide-react';
import {
  Cabinet,
  BinCase,
  AnalyticsSummary,
  SlottingRecommendation,
  searchWarehouseBins,
  getABCClass,
  calculatePackageVolumeCm3,
  ColorMode3D,
} from '../utils/warehouseLogic';

interface CatalogAndAnalyticsViewsProps {
  activeModal: 'catalog' | 'analytics' | 'optimize';
  cabinets: Cabinet[];
  analytics: AnalyticsSummary;
  recommendations: SlottingRecommendation[];
  onClose: () => void;
  onLocateBinIn3D: (cabinetId: string, binId: string) => void;
  onAdjustQuantity: (binId: string, delta: number) => void;
  onApplyRecommendations: () => void;
  onSwitch3DColorMode: (mode: ColorMode3D) => void;
}

export const CatalogAndAnalyticsViews: React.FC<CatalogAndAnalyticsViewsProps> = ({
  activeModal,
  cabinets,
  analytics,
  recommendations,
  onClose,
  onLocateBinIn3D,
  onAdjustQuantity,
  onApplyRecommendations,
  onSwitch3DColorMode,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [packagingFilter, setPackagingFilter] = useState<string>('ALL');

  const [aiCommentary, setAiCommentary] = useState<string>(
    "Analyse en temps réel des taux de rotation et des gabarits d'emballage sur l'ensemble des armoires 3D..."
  );
  const [isLoadingAI, setIsLoadingAI] = useState<boolean>(false);
  const [appliedBanner, setAppliedBanner] = useState<boolean>(false);

  useEffect(() => {
    if (activeModal === 'optimize') {
      setIsLoadingAI(true);
      fetch('/api/ai/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cabinetsSummary: analytics.cabinetMetrics,
          recommendations,
        }),
      })
        .then((r) => r.json())
        .then((data) => {
          if (data.aiCommentary) {
            setAiCommentary(data.aiCommentary);
          }
        })
        .catch(() => {})
        .finally(() => setIsLoadingAI(false));
    }
  }, [activeModal, recommendations.length]);

  const filteredBins: BinCase[] = searchWarehouseBins(
    cabinets,
    searchQuery,
    categoryFilter,
    packagingFilter
  );

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/75 p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="data-overlay-title"
    >
      <div className="w-full max-w-6xl bg-[#0F172A] border border-slate-800 rounded-xl shadow-2xl overflow-hidden my-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#0B1120] border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              {activeModal === 'catalog' && <Package className="w-5 h-5" />}
              {activeModal === 'analytics' && <BarChart3 className="w-5 h-5" />}
              {activeModal === 'optimize' && <Sparkles className="w-5 h-5" />}
            </div>
            <div>
              <h2
                id="data-overlay-title"
                className="text-lg font-bold text-slate-100 font-display"
              >
                {activeModal === 'catalog' &&
                  "Catalogue Temps Réel — Références & Tailles d'Emballage"}
                {activeModal === 'analytics' &&
                  'Tableau de Bord Analytique — Taux de Rotation & Occupation 3D'}
                {activeModal === 'optimize' &&
                  'Assistance IA — Optimisation des Emplacements (Slotting ABC)'}
              </h2>
              <p className="text-xs text-slate-400">
                {activeModal === 'catalog' &&
                  'Consultez chaque référence, ses dimensions L×l×H cm, ajustez les stocks en direct ou naviguez vers la case en 3D.'}
                {activeModal === 'analytics' &&
                  'Suivi du taux de rotation annuel par référence et par armoire, classification ABC et alertes de réapprovisionnement.'}
                {activeModal === 'optimize' &&
                  "Recommandations IA basées sur la rotation des articles, le poids d'emballage et la distance au quai d'expédition."}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer le panneau"
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 max-h-[80vh] overflow-y-auto space-y-6">
          {/* VIEW 1: MASTER CATALOG & PACKAGING SIZES */}
          {activeModal === 'catalog' && (
            <div className="space-y-4">
              {/* Filter & Search Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-[#0B1120] p-3.5 rounded-lg border border-slate-800">
                <div className="relative flex-1 min-w-[240px]">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Rechercher par référence (ex: HYD-1040), produit, armoire..."
                    aria-label="Rechercher une référence dans le catalogue"
                    className="w-full pl-9 pr-3 py-2 text-xs bg-[#0F172A] border border-slate-700 rounded-lg text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <select
                    aria-label="Filtrer par catégorie"
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="px-3 py-2 text-xs bg-[#0F172A] border border-slate-700 rounded-lg text-slate-200"
                  >
                    <option value="ALL">Toutes Catégories</option>
                    <option value="Hydraulique">Hydraulique</option>
                    <option value="Électronique">Électronique</option>
                    <option value="Mécanique">Mécanique</option>
                    <option value="Fixation">Fixation</option>
                    <option value="Maintenance">Maintenance</option>
                  </select>

                  <select
                    aria-label="Filtrer par taille d'emballage"
                    value={packagingFilter}
                    onChange={(e) => setPackagingFilter(e.target.value)}
                    className="px-3 py-2 text-xs bg-[#0F172A] border border-slate-700 rounded-lg text-slate-200"
                  >
                    <option value="ALL">Tous Formats d&apos;Emballage</option>
                    <option value="Bac Europe S">Bac Europe S (30×20×15)</option>
                    <option value="Carton Standard M">
                      Carton Standard M (40×30×22)
                    </option>
                    <option value="Caisse Renforcée L">
                      Caisse Renforcée L (50×35×28)
                    </option>
                    <option value="Coffre Lourd XL">
                      Coffre Lourd XL (60×40×35)
                    </option>
                    <option value="Tube / Rouleau">
                      Tube / Rouleau (55×16×16)
                    </option>
                  </select>
                </div>
              </div>

              {/* High-Density Product & Packaging Table */}
              <div className="border border-slate-800 rounded-lg overflow-x-auto bg-[#0B1120]">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-[11px] font-semibold text-slate-400 bg-[#0F172A]/60">
                      <th className="py-3 px-4">Référence SKU</th>
                      <th className="py-3 px-4">Désignation &amp; Catégorie</th>
                      <th className="py-3 px-4">Emplacement 3D</th>
                      <th className="py-3 px-4">
                        Taille d&apos;Emballage (L×l×H)
                      </th>
                      <th className="py-3 px-4 text-right">Rotation / An</th>
                      <th className="py-3 px-4 text-right">Stock Temps Réel</th>
                      <th className="py-3 px-4 text-right">Action 3D</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80 text-xs">
                    {filteredBins.length === 0 ? (
                      <tr>
                        <td
                          colSpan={7}
                          className="py-10 text-center text-slate-400"
                        >
                          Aucune référence ne correspond aux critères de recherche.
                        </td>
                      </tr>
                    ) : (
                      filteredBins.map((bin) => {
                        const p = bin.product!;
                        const volLiters = (
                          calculatePackageVolumeCm3(p.dimensionsCm) / 1000
                        ).toFixed(1);
                        const abc = getABCClass(p.turnoverRate);
                        const isLowStock = p.quantity <= p.minThreshold;

                        return (
                          <tr
                            key={bin.id}
                            className="hover:bg-slate-800/40 transition-colors"
                          >
                            <td className="py-3 px-4 font-mono font-bold text-amber-400 whitespace-nowrap">
                              {p.reference}
                              {p.scannedFromImage && (
                                <span className="ml-2 text-[10px] font-normal text-emerald-400">
                                  · Scanné IA
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              <div className="font-medium text-slate-100">
                                {p.name}
                              </div>
                              <div className="text-[11px] text-slate-400">
                                {p.category} · Poids unitaire {p.weightKg} kg
                              </div>
                            </td>
                            <td className="py-3 px-4 font-mono text-slate-200 whitespace-nowrap">
                              {bin.code}
                            </td>
                            <td className="py-3 px-4 whitespace-nowrap">
                              <div className="font-medium text-slate-200">
                                {p.packagingType}
                              </div>
                              <div className="text-[11px] font-mono text-slate-400 tabular-nums">
                                {p.dimensionsCm.lengthCm} ×{' '}
                                {p.dimensionsCm.widthCm} ×{' '}
                                {p.dimensionsCm.heightCm} cm · {volLiters} L
                              </div>
                            </td>
                            <td className="py-3 px-4 text-right font-mono tabular-nums whitespace-nowrap">
                              <span
                                className={
                                  abc === 'A'
                                    ? 'text-emerald-400 font-semibold'
                                    : abc === 'B'
                                    ? 'text-amber-400'
                                    : 'text-slate-400'
                                }
                              >
                                {p.turnoverRate.toFixed(1)}/an · Cl.{abc}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right whitespace-nowrap">
                              <div className="inline-flex items-center gap-1.5 font-mono tabular-nums">
                                <button
                                  type="button"
                                  aria-label={`Diminuer quantité ${p.reference}`}
                                  onClick={() => onAdjustQuantity(bin.id, -1)}
                                  className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span
                                  className={`w-10 text-center font-bold ${
                                    isLowStock
                                      ? 'text-red-400'
                                      : 'text-slate-100'
                                  }`}
                                >
                                  {p.quantity}
                                </span>
                                <button
                                  type="button"
                                  aria-label={`Augmenter quantité ${p.reference}`}
                                  onClick={() => onAdjustQuantity(bin.id, 1)}
                                  className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>
                              {isLowStock && (
                                <div className="text-[10px] text-red-400 mt-0.5">
                                  Seuil min ({p.minThreshold})
                                </div>
                              )}
                            </td>
                            <td className="py-3 px-4 text-right whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() => {
                                  onLocateBinIn3D(bin.cabinetId, bin.id);
                                  onClose();
                                }}
                                className="px-3 py-1.5 text-xs font-semibold bg-amber-500/15 hover:bg-amber-500 text-amber-300 hover:text-slate-950 border border-amber-500/40 rounded-lg transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                              >
                                <Navigation className="w-3.5 h-3.5" />
                                <span>Localiser en 3D</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* VIEW 2: TURNOVER RATE & ANALYTICS DASHBOARD */}
          {activeModal === 'analytics' && (
            <div className="space-y-6">
              {/* Top 4 KPI Strip */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 bg-[#0B1120] border border-slate-800 rounded-lg">
                  <div className="text-xs text-slate-400">
                    Taux de Rotation Moyen Global
                  </div>
                  <div className="text-2xl font-bold text-emerald-400 font-mono tabular-nums mt-1">
                    {analytics.avgTurnoverRate} rot./an
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    Score Ergonomique Slotting :{' '}
                    <strong className="text-slate-200">
                      {analytics.ergonomicSlottingScore}%
                    </strong>
                  </div>
                </div>

                <div className="p-4 bg-[#0B1120] border border-slate-800 rounded-lg">
                  <div className="text-xs text-slate-400">
                    Occupation des Cases 3D
                  </div>
                  <div className="text-2xl font-bold text-slate-100 font-mono tabular-nums mt-1">
                    {analytics.occupiedBins} / {analytics.totalBins} (
                    {analytics.occupancyPercent}%)
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    Réparties sur {analytics.totalCabinets} armoires actives
                  </div>
                </div>

                <div className="p-4 bg-[#0B1120] border border-slate-800 rounded-lg">
                  <div className="text-xs text-slate-400">
                    Volume Cumulé des Emballages
                  </div>
                  <div className="text-2xl font-bold text-sky-400 font-mono tabular-nums mt-1">
                    {analytics.totalPackagingVolumeM3} m³
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    {analytics.totalUnitsInStock} unités physiques en stock
                  </div>
                </div>

                <div className="p-4 bg-[#0B1120] border border-slate-800 rounded-lg">
                  <div className="text-xs text-slate-400">
                    Alertes Seuil Réapprovisionnement
                  </div>
                  <div className="text-2xl font-bold text-amber-400 font-mono tabular-nums mt-1 flex items-center gap-2">
                    <span>{analytics.lowStockCount} références</span>
                    {analytics.lowStockCount > 0 && (
                      <AlertTriangle className="w-5 h-5 text-amber-400" />
                    )}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    Sous le seuil critique défini
                  </div>
                </div>
              </div>

              {/* ABC Turnover Distribution + 3D Thermal View Trigger */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-6 p-5 bg-[#0B1120] border border-slate-800 rounded-lg space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-100">
                        Répartition ABC du Taux de Rotation
                      </h3>
                      <p className="text-xs text-slate-400">
                        Segmentation des références selon leur vitesse de rotation annuelle
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        onSwitch3DColorMode('rotation');
                        onClose();
                      }}
                      className="px-3 py-1.5 text-xs font-semibold bg-emerald-500/15 hover:bg-emerald-500 text-emerald-300 hover:text-slate-950 border border-emerald-500/40 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <Flame className="w-3.5 h-3.5 shrink-0" />
                      <span>Activer Vue Thermique 3D</span>
                    </button>
                  </div>

                  <div className="space-y-3.5 pt-1">
                    {[
                      {
                        data: analytics.abcDistribution.classA,
                        barColor: 'bg-emerald-500',
                        textColor: 'text-emerald-400',
                      },
                      {
                        data: analytics.abcDistribution.classB,
                        barColor: 'bg-amber-500',
                        textColor: 'text-amber-400',
                      },
                      {
                        data: analytics.abcDistribution.classC,
                        barColor: 'bg-indigo-500',
                        textColor: 'text-indigo-400',
                      },
                    ].map((row, i) => (
                      <div key={i} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-200 font-medium">
                            {row.data.label}
                          </span>
                          <span
                            className={`font-mono tabular-nums font-semibold ${row.textColor}`}
                          >
                            {row.data.count} réf. ({row.data.percent}%)
                          </span>
                        </div>
                        <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${row.barColor}`}
                            style={{ width: `${Math.max(4, row.data.percent)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Cabinet Rotation & Occupancy Breakdown */}
                <div className="lg:col-span-6 p-5 bg-[#0B1120] border border-slate-800 rounded-lg space-y-4">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-100">
                      Performance &amp; Taux de Rotation par Armoire 3D
                    </h3>
                    <p className="text-xs text-slate-400">
                      Comparaison de la densité de stockage et de la vélocité par armoire
                    </p>
                  </div>

                  <div className="space-y-3">
                    {analytics.cabinetMetrics.map((cm) => (
                      <div
                        key={cm.cabinetId}
                        className="p-3 bg-[#0F172A] border border-slate-800 rounded-lg flex items-center justify-between gap-4"
                      >
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-slate-100 truncate">
                            <span className="font-mono text-amber-400 mr-2">
                              {cm.cabinetCode}
                            </span>
                            {cm.cabinetName.replace(
                              /^Armoire [A-Z0-9]+ — /,
                              ''
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono tabular-nums mt-0.5">
                            Occupation : {cm.occupiedBins}/{cm.totalBins} cases (
                            {cm.occupancyPercent}%) · {cm.totalUnits} unités
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <div className="text-xs font-mono font-bold text-emerald-400 tabular-nums">
                            {cm.avgTurnoverRate} rot./an
                          </div>
                          <div className="text-[10px] text-slate-400">
                            Rotation moy.
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* VIEW 3: AI SLOTTING & PLACEMENT OPTIMIZER */}
          {activeModal === 'optimize' && (
            <div className="space-y-5">
              {/* AI Strategic Commentary */}
              <div className="p-5 bg-[#0B1120] border border-slate-800 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-amber-400 flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    <span>Diagnostic Logistique IA (Slotting ABC &amp; Ergonomie)</span>
                  </span>
                  <span className="text-xs font-mono text-slate-400 tabular-nums">
                    Score Slotting Actuel :{' '}
                    <strong className="text-emerald-400">
                      {analytics.ergonomicSlottingScore}/100
                    </strong>
                  </span>
                </div>
                <p className="text-xs text-slate-200 leading-relaxed">
                  {isLoadingAI
                    ? 'Calcul des trajectoires de picking et des contraintes de poids en cours...'
                    : aiCommentary}
                </p>
              </div>

              {appliedBanner && (
                <div className="p-4 bg-emerald-950/60 border border-emerald-700/70 rounded-lg flex items-center gap-3 text-xs text-emerald-200">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <div>
                    <div className="font-semibold">
                      Optimisation IA appliquée avec succès dans l&apos;entrepôt 3D !
                    </div>
                    <div>
                      Les références à haute rotation ont été transférées vers les étagères ergonomiques (niveaux E1/E2) proches du quai d&apos;expédition.
                    </div>
                  </div>
                </div>
              )}

              {/* Concrete Recommendations List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-100">
                    Mouvements de Cases Recommandés ({recommendations.length})
                  </h3>
                  {recommendations.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        onApplyRecommendations();
                        setAppliedBanner(true);
                      }}
                      className="px-4 py-2 text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg transition-colors flex items-center gap-2 cursor-pointer"
                    >
                      <ArrowRightLeft className="w-4 h-4" />
                      <span>
                        Appliquer l&apos;Optimisation IA ({recommendations.length}{' '}
                        transferts)
                      </span>
                    </button>
                  )}
                </div>

                {recommendations.length === 0 ? (
                  <div className="p-8 bg-[#0B1120] border border-slate-800 rounded-lg text-center space-y-2">
                    <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                    <div className="text-sm font-semibold text-slate-200">
                      Implantation 3D Optimale !
                    </div>
                    <p className="text-xs text-slate-400">
                      Toutes les références Classe A à forte rotation sont déjà positionnées sur des étagères ergonomiques proches du quai.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {recommendations.map((rec) => (
                      <div
                        key={rec.id}
                        className="p-4 bg-[#0B1120] border border-slate-800 rounded-lg space-y-3 flex flex-col justify-between"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-mono font-bold text-amber-400">
                              {rec.sourceProductRef} · {rec.sourceProductName}
                            </span>
                            <span className="font-mono text-emerald-400 font-semibold">
                              {rec.impactMetric}
                            </span>
                          </div>

                          <p className="text-xs text-slate-300">{rec.reason}</p>
                        </div>

                        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono">
                          <div>
                            <span className="text-slate-400">Actuel: </span>
                            <span className="text-red-300 font-semibold">
                              {rec.sourceBinCode}
                            </span>
                          </div>
                          <ArrowRightLeft className="w-3.5 h-3.5 text-amber-400" />
                          <div>
                            <span className="text-slate-400">Cible IA: </span>
                            <span className="text-emerald-400 font-semibold">
                              {rec.targetBinCode}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
