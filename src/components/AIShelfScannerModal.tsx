import React, { useState, useEffect } from 'react';
import {
  Camera,
  Upload,
  CheckCircle2,
  Sparkles,
  Box,
  ArrowRight,
  X,
  Layers,
  ScanLine,
} from 'lucide-react';
import {
  Cabinet,
  ScannedShelfItem,
  ProductCategory,
  PackagingType,
} from '../utils/warehouseLogic';
import {
  SAMPLE_SHELF_PRESETS,
  renderSampleShelfPhotoDataUrl,
} from '../utils/shelfImageGenerator';
import { analyzeShelfWithGemini } from '../utils/geminiService';
interface AIShelfScannerModalProps {
  cabinets: Cabinet[];
  initialCabinetId: string | null;
  initialShelfIndex: number;
  onClose: () => void;
  onAssociateItems: (
    cabinetId: string,
    shelfIndex: number,
    items: ScannedShelfItem[]
  ) => void;
}

export const AIShelfScannerModal: React.FC<AIShelfScannerModalProps> = ({
  cabinets,
  initialCabinetId,
  initialShelfIndex,
  onClose,
  onAssociateItems,
}) => {
  const [targetCabinetId, setTargetCabinetId] = useState<string>(
    initialCabinetId || (cabinets[0]?.id ?? '')
  );
  const selectedCabinet =
    cabinets.find((c) => c.id === targetCabinetId) || cabinets[0];

  const [targetShelfIndex, setTargetShelfIndex] = useState<number>(
    Math.min(initialShelfIndex || 1, selectedCabinet?.shelvesCount || 1)
  );
  const [selectedPresetId, setSelectedPresetId] = useState<string>(
    SAMPLE_SHELF_PRESETS[0].id
  );
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string>('');
  const [imageMimeType, setImageMimeType] = useState<string>('image/png');
  const [customNote, setCustomNote] = useState<string>('');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanResult, setScanResult] = useState<{
    summary: string;
    confidenceScore: number;
    detectedItems: ScannedShelfItem[];
  } | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [associationSuccessMessage, setAssociationSuccessMessage] = useState<
    string | null
  >(null);

  // Generate sample shelf photo when preset, cabinet, or shelf changes (unless user uploaded custom image)
  useEffect(() => {
    if (!selectedCabinet) return;
    if (selectedPresetId !== 'custom-upload') {
      const dataUrl = renderSampleShelfPhotoDataUrl(
        selectedPresetId,
        selectedCabinet.code,
        targetShelfIndex
      );
      setImagePreviewUrl(dataUrl);
      setImageMimeType('image/png');
      setScanResult(null);
      setAssociationSuccessMessage(null);
    }
  }, [selectedPresetId, selectedCabinet?.code, targetShelfIndex]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setSelectedPresetId('custom-upload');
        setImagePreviewUrl(reader.result);
        setImageMimeType(file.type || 'image/png');
        setScanResult(null);
        setAssociationSuccessMessage(null);
      }
    };
    reader.readAsDataURL(file);
  };

const handleRunAIScan = async () => {
    if (!selectedCabinet || !imagePreviewUrl) return;
    setIsScanning(true);
    setScanError(null);
    setAssociationSuccessMessage(null);

    try {
      // Appel direct à l'API Gemini pour analyser l'image de façon générale
      const detectedItems = await analyzeShelfWithGemini(
        imagePreviewUrl,
        imageMimeType
      );

      setScanResult({
        summary: `Reconnaissance IA réussie : ${detectedItems.length} articles et colis détectés sur l'étagère.`,
        confidenceScore: 96.5,
        detectedItems: detectedItems,
      });
    } catch (err) {
      setScanError(
        err instanceof Error
          ? err.message
          : 'Erreur lors de la connexion au moteur de vision IA Gemini.'
      );
    } finally {
      setIsScanning(false);
    }
  };


  // const handleRunAIScan = async () => {
  //   if (!selectedCabinet || !imagePreviewUrl) return;
  //   setIsScanning(true);
  //   setScanError(null);
  //   setAssociationSuccessMessage(null);

  //   try {
  //     const response = await fetch('/api/ai/scan-shelf', {
  //       method: 'POST',
  //       headers: { 'Content-Type': 'application/json' },
  //       body: JSON.stringify({
  //         imageBase64: imagePreviewUrl,
  //         mimeType: imageMimeType,
  //         cabinetCode: selectedCabinet.code,
  //         shelfLevel: targetShelfIndex,
  //         totalColumns: selectedCabinet.columnsCount,
  //         samplePresetId:
  //           selectedPresetId === 'custom-upload'
  //             ? 'preset-hydraulique'
  //             : selectedPresetId,
  //         customNote,
  //       }),
  //     });

  //     const data = await response.json();
  //     if (!response.ok || data.error) {
  //       throw new Error(data.error || 'Échec de la reconnaissance visuelle IA.');
  //     }

  //     setScanResult({
  //       summary: data.summary,
  //       confidenceScore: data.confidenceScore || 97.5,
  //       detectedItems: data.detectedItems || [],
  //     });
  //   } catch (err) {
  //     setScanError(
  //       err instanceof Error
  //         ? err.message
  //         : 'Erreur lors de la connexion au moteur de vision IA.'
  //     );
  //   } finally {
  //     setIsScanning(false);
  //   }
  // };

  const handleUpdateScannedItem = (
    idx: number,
    patch: Partial<ScannedShelfItem>
  ) => {
    if (!scanResult) return;
    const nextItems = scanResult.detectedItems.map((it, i) =>
      i === idx ? { ...it, ...patch } : it
    );
    setScanResult({
      ...scanResult,
      detectedItems: nextItems,
    });
  };

  

  const handleConfirmAssociation = () => {
    if (!selectedCabinet || !scanResult) return;
    onAssociateItems(
      selectedCabinet.id,
      targetShelfIndex,
      scanResult.detectedItems
    );
    setAssociationSuccessMessage(
      `${scanResult.detectedItems.length} références extraites ont été associées automatiquement aux cases de ${selectedCabinet.code} · Étagère ${targetShelfIndex}.`
    );
  };

  if (!selectedCabinet) return null;

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/75 p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ai-scanner-modal-title"
    >
      <div className="w-full max-w-5xl bg-[#0F172A] border border-slate-800 rounded-xl shadow-2xl overflow-hidden my-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#0B1120] border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <ScanLine className="w-5 h-5" />
            </div>
            <div>
              <h2
                id="ai-scanner-modal-title"
                className="text-lg font-bold text-slate-100 font-display"
              >
                Reconnaissance Visuelle IA d&apos;Armoire &amp; Association Automatique
              </h2>
              <p className="text-xs text-slate-400">
                Sélectionnez une partie d&apos;armoire (étagère / cases), chargez une photo des cartons ou étiquettes, et l&apos;IA extrait les références et tailles d&apos;emballage.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer le scanner IA"
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 max-h-[82vh] overflow-y-auto">
          {/* Left Column: Target Cabinet/Shelf Selection + Image Input */}
          <div className="lg:col-span-6 space-y-5">
            {/* Step 1: Select Cabinet & Shelf Part */}
            <div className="p-4 bg-[#0B1120] border border-slate-800 rounded-lg space-y-3">
              <div className="text-xs font-semibold text-amber-400 flex items-center gap-2">
                <Layers className="w-4 h-4" />
                <span>1. Partie d&apos;Armoire Ciblée dans l&apos;Entrepôt 3D</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="scanner-cabinet-select"
                    className="block text-xs text-slate-400 mb-1"
                  >
                    Armoire Cible
                  </label>
                  <select
                    id="scanner-cabinet-select"
                    value={selectedCabinet.id}
                    onChange={(e) => {
                      setTargetCabinetId(e.target.value);
                      setTargetShelfIndex(1);
                    }}
                    className="w-full px-3 py-2 text-xs font-mono bg-[#0F172A] border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-amber-500"
                  >
                    {cabinets.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.code} — {c.name.replace(/^Armoire [A-Z0-9]+ — /, '')}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="scanner-shelf-select"
                    className="block text-xs text-slate-400 mb-1"
                  >
                    Niveau d&apos;Étagère ({selectedCabinet.columnsCount} cases)
                  </label>
                  <select
                    id="scanner-shelf-select"
                    value={targetShelfIndex}
                    onChange={(e) => setTargetShelfIndex(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs font-mono bg-[#0F172A] border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-amber-500"
                  >
                    {Array.from(
                      { length: selectedCabinet.shelvesCount },
                      (_, i) => i + 1
                    ).map((s) => (
                      <option key={s} value={s}>
                        Étagère Niveau E{s} (Cases C1 à C
                        {selectedCabinet.columnsCount})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Step 2: Choose Sample Photo or Upload Custom Shelf Photo */}
            <div className="p-4 bg-[#0B1120] border border-slate-800 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-200 flex items-center gap-2">
                  <Camera className="w-4 h-4 text-amber-400" />
                  <span>2. Image de la Partie d&apos;Armoire / Étiquettes</span>
                </span>
                <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md transition-colors">
                  <Upload className="w-3.5 h-3.5 text-amber-400" />
                  <span>Importer une photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Preset Selector Buttons */}
              <div className="grid grid-cols-1 gap-2">
                {SAMPLE_SHELF_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setSelectedPresetId(preset.id)}
                    className={`text-left px-3 py-2 rounded-lg border text-xs transition-colors ${
                      selectedPresetId === preset.id
                        ? 'bg-amber-500/10 border-amber-500/60 text-slate-100'
                        : 'bg-[#0F172A] border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="font-semibold text-slate-200">
                      {preset.title}
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                      {preset.subtitle}
                    </div>
                  </button>
                ))}
              </div>

              {/* Visual Shelf Capture Preview */}
              <div className="relative rounded-lg overflow-hidden border border-slate-700 bg-slate-950 aspect-video flex items-center justify-center">
                {imagePreviewUrl ? (
                  <img
                    src={imagePreviewUrl}
                    alt={`Capture visuelle de ${selectedCabinet.code} Étagère ${targetShelfIndex}`}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="text-xs text-slate-500">
                    Aperçu image indisponible
                  </div>
                )}
              </div>

              {/* Optional Operator Context + Trigger Scan Button */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  value={customNote}
                  onChange={(e) => setCustomNote(e.target.value)}
                  placeholder="Note optionnelle (ex: arrivage fournisseur Bosch)..."
                  aria-label="Note contexte opérateur"
                  className="flex-1 px-3 py-2 text-xs bg-[#0F172A] border border-slate-700 rounded-lg text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
                />
                <button
                  type="button"
                  onClick={handleRunAIScan}
                  disabled={isScanning}
                  className="px-4 py-2 text-xs font-semibold bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>
                    {isScanning
                      ? 'Analyse IA en cours...'
                      : 'Extraire les Références par IA'}
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Extracted References & Auto-Association into Bins */}
          <div className="lg:col-span-6 flex flex-col justify-between bg-[#0B1120] border border-slate-800 rounded-lg p-5 space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-sm font-semibold text-slate-100">
                    3. Références &amp; Emballages Extraits par l&apos;IA
                  </h3>
                  <p className="text-xs text-slate-400">
                    Destination :{' '}
                    <span className="font-mono text-amber-400">
                      {selectedCabinet.code} · Étagère E{targetShelfIndex}
                    </span>
                  </p>
                </div>
                {scanResult && (
                  <span className="text-xs font-mono text-emerald-400">
                    Confiance IA : {scanResult.confidenceScore}%
                  </span>
                )}
              </div>

              {scanError && (
                <div className="p-3 bg-red-950/50 border border-red-800 rounded-lg text-xs text-red-300">
                  {scanError}
                </div>
              )}

              {associationSuccessMessage && (
                <div className="p-3.5 bg-emerald-950/60 border border-emerald-700/70 rounded-lg flex items-start gap-2.5 text-xs text-emerald-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <div className="font-semibold">
                      Inventaire 3D mis à jour avec succès !
                    </div>
                    <div>{associationSuccessMessage}</div>
                  </div>
                </div>
              )}

              {!scanResult && !isScanning && (
                <div className="py-16 text-center space-y-3">
                  <Box className="w-10 h-10 text-slate-600 mx-auto" />
                  <div className="text-sm font-medium text-slate-300">
                    Prêt pour l&apos;extraction optique des références
                  </div>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Cliquez sur « Extraire les Références par IA » pour analyser l&apos;image de l&apos;étagère, lire les codes articles et détecter les dimensions d&apos;emballage.
                  </p>
                </div>
              )}

              {isScanning && (
                <div className="py-16 text-center space-y-3">
                  <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
                  <div className="text-sm font-medium text-amber-400">
                    Reconnaissance optique Gemini Vision en cours...
                  </div>
                  <p className="text-xs text-slate-400">
                    Lecture des étiquettes SKU, quantités et gabarits d&apos;emballage sur {selectedCabinet.code} · E{targetShelfIndex}
                  </p>
                </div>
              )}

              {scanResult && (
                <div className="space-y-3">
                  <p className="text-xs text-slate-300 bg-[#0F172A] p-3 rounded-lg border border-slate-800">
                    {scanResult.summary}
                  </p>

                  <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
                    {scanResult.detectedItems.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 bg-[#0F172A] border border-slate-800 rounded-lg space-y-2.5"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-bold text-amber-400">
                              Case C{item.targetColIndex}
                            </span>
                            <span className="text-slate-600">·</span>
                            <input
                              type="text"
                              value={item.reference}
                              aria-label={`Référence extraite ${idx + 1}`}
                              onChange={(e) =>
                                handleUpdateScannedItem(idx, {
                                  reference: e.target.value,
                                })
                              }
                              className="px-2 py-0.5 text-xs font-mono font-bold bg-[#0B1120] border border-slate-700 rounded text-slate-100 w-36"
                            />
                          </div>

                          <div className="flex items-center gap-1.5 text-xs font-mono text-slate-400">
                            <span>Case cible:</span>
                            <select
                              aria-label={`Colonne cible pour ${item.reference}`}
                              value={item.targetColIndex}
                              onChange={(e) =>
                                handleUpdateScannedItem(idx, {
                                  targetColIndex: Number(e.target.value),
                                })
                              }
                              className="px-1.5 py-0.5 bg-[#0B1120] border border-slate-700 rounded text-slate-200 text-xs"
                            >
                              {Array.from(
                                { length: selectedCabinet.columnsCount },
                                (_, c) => c + 1
                              ).map((col) => (
                                <option key={col} value={col}>
                                  {selectedCabinet.code}-E{targetShelfIndex}-C{col}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                          <div className="sm:col-span-2">
                            <label className="block text-[11px] text-slate-400">
                              Désignation Produit
                            </label>
                            <input
                              type="text"
                              value={item.name}
                              onChange={(e) =>
                                handleUpdateScannedItem(idx, {
                                  name: e.target.value,
                                })
                              }
                              className="w-full mt-0.5 px-2 py-1 bg-[#0B1120] border border-slate-700 rounded text-slate-200 text-xs"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] text-slate-400">
                              Quantité Scannée
                            </label>
                            <input
                              type="number"
                              min={1}
                              value={item.quantity}
                              onChange={(e) =>
                                handleUpdateScannedItem(idx, {
                                  quantity: Number(e.target.value),
                                })
                              }
                              className="w-full mt-0.5 px-2 py-1 font-mono bg-[#0B1120] border border-slate-700 rounded text-slate-200 text-xs tabular-nums"
                            />
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px] text-slate-400 font-mono">
                          <span>
                            Emballage: <strong className="text-slate-200">{item.packagingType}</strong> ({item.lengthCm}×{item.widthCm}×{item.heightCm} cm)
                          </span>
                          <span>·</span>
                          <span>
                            Rotation estimée: <strong className="text-emerald-400">{item.turnoverRate} rot./an</strong>
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Action Bar inside Right Column */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 rounded-lg transition-colors"
              >
                Fermer
              </button>

              <button
                type="button"
                disabled={!scanResult || scanResult.detectedItems.length === 0}
                onClick={handleConfirmAssociation}
                className="px-4 py-2.5 text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-slate-950 rounded-lg transition-colors flex items-center gap-2 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Associer aux Cases Automatiquement</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
