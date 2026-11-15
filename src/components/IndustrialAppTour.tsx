import React, { useState, useEffect, useCallback } from 'react';
import { 
  X, 
  ArrowRight, 
  ArrowLeft, 
  Check, 
  Play, 
  Pause, 
  Crosshair, 
  Layers, 
  ScanLine, 
  Flame,
  Maximize2,
  FileSpreadsheet,
  PackageSearch,
  SlidersHorizontal,
  Compass,
  Sparkles,
  MousePointer
} from 'lucide-react';

interface TourChapter {
  id: string;
  chapterNumber: string;
  targetSelector: string;
  badge: string;
  title: string;
  role: string;
  howToUse: string;
  businessBenefit: string;
  technicalMetric: string;
  icon: React.ReactNode;
}

const TOUR_CHAPTERS: TourChapter[] = [
  {
    id: 'step-welcome',
    chapterNumber: '01',
    targetSelector: 'main',
    badge: 'VUE SPATIALE 3D // DIGITAL TWIN',
    title: 'Immersion & Navigation dans l\'Entrepôt 3D',
    role: 'Représentation spatiale temps réel de vos travées, rayonnages métalliques et colis industriels.',
    howToUse: '• Clic gauche maintenu : faire pivoter la caméra (orbite 360°)\n• Clic droit maintenu : translater la vue dans les allées\n• Molette : zoomer sur un casier spécifique',
    businessBenefit: 'Supprime les listings papier abstraits et permet de visiter le magasin à distance.',
    technicalMetric: 'Moteur Three.js / WebGL 2.0 · 60 FPS constants',
    icon: <Maximize2 className="w-5 h-5 text-amber-400" />,
  },
  {
    id: 'step-navbar',
    chapterNumber: '02',
    targetSelector: 'header nav',
    badge: 'PIPELINE LOGISTIQUE // 5 MODULES',
    title: 'Barre de Commande des Modules',
    role: 'Accès instantané aux 5 fonctionnalités maîtresses de la gestion de stock.',
    howToUse: 'Cliquez sur un onglet pour basculer : Plan 2D d\'agencement, Entrepôt 3D, Scanner par caméra, Catalogue d\'articles ou Analytique ergonomique.',
    businessBenefit: 'Routage fluide sans aucun rechargement de page (Single Page Application).',
    technicalMetric: 'Persistance Local-First garantie sans serveur backend',
    icon: <Layers className="w-5 h-5 text-cyan-400" />,
  },
  {
    id: 'step-inspector',
    chapterNumber: '03',
    targetSelector: 'section[aria-label="Emplacement 3D sélectionné"], main > section:first-of-type',
    badge: 'INSPECTEUR // CONTRÔLE CASIER',
    title: 'Fiche Technique d\'Emplacement & Contrôle Gabarit',
    role: 'Affiche l\'état de santé exact d\'un casier dès que vous cliquez dessus dans la 3D.',
    howToUse: 'Cliquez sur n\'importe quel colis d\'une étagère pour consulter : référence SKU, quantité, rotation annuelle et vérification dimensionnelle (L×l×H cm vs largeur de case).',
    businessBenefit: 'Évite les erreurs de rangement et prévient les débordements de colis hors des étagères.',
    technicalMetric: 'Calcul volumétrique automatique en centimètres cubes',
    icon: <Compass className="w-5 h-5 text-amber-400" />,
  },
  {
    id: 'step-heatmaps',
    chapterNumber: '04',
    targetSelector: 'main [role="toolbar"], main .bottom-control-dock, main > div:last-child',
    badge: 'ANALYSE VISUELLE // CARTES THERMIQUES',
    title: 'Dock de Caméra & Cartes Thermiques ABC',
    role: 'Révèle instantanément les zones chaudes et les anomalies de votre stock.',
    howToUse: '• Bouton "Thermique Rotation" : colore les cases en rouge (haute rotation) ou bleu (faible rotation)\n• Bouton "Alertes Stock" : met en surbrillance rouge les casiers en rupture\n• Préréglages : bascule en vue "Allée Centrale" ou "Vue Globale"',
    businessBenefit: 'Diagnostic visuel en 3 secondes des flux sans ouvrir un seul tableur.',
    technicalMetric: 'Coloration dynamique de shaders WebGL temps réel',
    icon: <Flame className="w-5 h-5 text-orange-400" />,
  },
  {
    id: 'step-studio-2d',
    chapterNumber: '05',
    targetSelector: 'header button',
    badge: 'STUDIO 2D // PLAN DE MASSE & CASIERS',
    title: 'Configuration 2D des Armoires & Cases Inégales',
    role: 'Outil de CAO/DAO pour agencer la salle et régler les dimensions des casiers sur mesure.',
    howToUse: 'Cliquez sur "+ Configurer en 2D" : déplacez les armoires, ajustez les cloisons d\'étagères au millimètre par glisser-déposer, ou tracez de nouvelles armoires rectangulaires.',
    businessBenefit: 'Permet de créer des casiers asymétriques parfaitement adaptés aux tailles réelles des colis.',
    technicalMetric: 'Grille magnétique au centimètre · Détection de collision AABB',
    icon: <SlidersHorizontal className="w-5 h-5 text-emerald-400" />,
  },
  {
    id: 'step-excel-sync',
    chapterNumber: '06',
    targetSelector: 'header a[href*="plan-2d"]',
    badge: 'INTEROPÉRABILITÉ // FICHIERS EXCEL',
    title: 'Import & Export Excel (.XLSX) et Auto-Rangement',
    role: 'Synchronisation directe avec vos listings de magasin et systèmes ERP.',
    howToUse: 'Dans le Studio 2D, chargez votre fichier Excel d\'articles (.xlsx) puis glissez un article directement dans une case 2D, ou cliquez sur "Auto-Organiser selon Dimensions".',
    businessBenefit: 'Zéro saisie manuelle : convertit un fichier Excel en entrepôt 3D opérationnel.',
    technicalMetric: 'Parseur XLSX universel · Extraction automatique des gabarits',
    icon: <FileSpreadsheet className="w-5 h-5 text-blue-400" />,
  },
  {
    id: 'step-ai-scanner',
    chapterNumber: '07',
    targetSelector: 'header a[href*="scanner"]',
    badge: 'VISION MACHINE // SCANNER IA',
    title: 'Inventaire Automatique par Analyse d\'Image',
    role: 'Identification automatique des colis et étiquettes par simple prise de vue.',
    howToUse: 'Ouvrez "Scanner IA", sélectionnez votre étagère, chargez une photo de rayon réel et cliquez sur "Extraire les Références" : le système reconnaît les articles et remplit les cases 3D.',
    businessBenefit: 'Divise par 5 le temps nécessaire aux inventaires tournants d\'atelier.',
    technicalMetric: 'Reconnaissance optique multimodale et tolérance aux pannes locale',
    icon: <ScanLine className="w-5 h-5 text-purple-400" />,
  },
  {
    id: 'step-analytics-slotting',
    chapterNumber: '08',
    targetSelector: 'header a[href*="analytique"]',
    badge: 'OPTIMISATION // SLOTTING ERGONOMIQUE',
    title: 'Algorithme de Réorganisation des Allées',
    role: 'Conseiller logistique intelligent pour minimiser la fatigue et les distances de marche.',
    howToUse: 'Consultez le score de slotting ergonomique. Si des pièces lourdes ou très demandées sont placées trop haut, cliquez sur "Appliquer les Recommandations" pour réorganiser les cases en 1 clic.',
    businessBenefit: 'Réduit jusqu\'à 35% les temps de trajet des préparateurs de commande.',
    technicalMetric: 'Classification ABC de Pareto & calcul d\'accessibilité physique',
    icon: <PackageSearch className="w-5 h-5 text-amber-300" />,
  },
];

const AUTOPLAY_STEP_MS = 6000; // 6 secondes par étape pour laisser le temps de lire

export const IndustrialAppTour: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [showChaptersMenu, setShowChaptersMenu] = useState(false);
  
  const [targetRect, setTargetRect] = useState({ x: 0, y: 0, width: 0, height: 0, found: false });
  const [viewport, setViewport] = useState({ w: window.innerWidth, h: window.innerHeight });

  const step = TOUR_CHAPTERS[currentIdx];
  const isFirst = currentIdx === 0;
  const isLast = currentIdx === TOUR_CHAPTERS.length - 1;

  // Calcul mathématique précis de la boîte englobante de l'élément cible
  const updateTargetGeometry = useCallback(() => {
    if (!isOpen) return;

    if (step.id === 'step-welcome') {
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      setTargetRect({ x: cx - 220, y: cy - 160, width: 440, height: 320, found: false });
      return;
    }

    const el = document.querySelector(step.targetSelector);
    if (el) {
      const rect = el.getBoundingClientRect();
      const pad = 8;
      setTargetRect({
        x: Math.max(6, rect.left - pad),
        y: Math.max(6, rect.top - pad),
        width: Math.min(window.innerWidth - 12, rect.width + pad * 2),
        height: Math.min(window.innerHeight - 12, rect.height + pad * 2),
        found: true,
      });
    } else {
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      setTargetRect({ x: cx - 200, y: cy - 120, width: 400, height: 240, found: false });
    }
  }, [isOpen, step]);

  useEffect(() => {
    const handleResize = () => {
      setViewport({ w: window.innerWidth, h: window.innerHeight });
      updateTargetGeometry();
    };
    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleResize, true);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleResize, true);
    };
  }, [updateTargetGeometry]);

  useEffect(() => {
    updateTargetGeometry();
  }, [currentIdx, updateTargetGeometry]);

  // Circulation automatique
  useEffect(() => {
    if (!isOpen || !isPlaying || isHovered || showChaptersMenu) return;

    const timer = setInterval(() => {
      setCurrentIdx((prev) => (prev >= TOUR_CHAPTERS.length - 1 ? 0 : prev + 1));
    }, AUTOPLAY_STEP_MS);

    return () => clearInterval(timer);
  }, [isOpen, isPlaying, isHovered, showChaptersMenu, currentIdx]);

  if (!isOpen) return null;

  // Positionnement dynamique du panneau d'explication pour ne pas masquer la cible
  const cardWidth = Math.min(500, viewport.w - 32);
  const isTargetTop = targetRect.y + targetRect.height / 2 < viewport.h / 2;
  const cardX = Math.max(16, Math.min(viewport.w - cardWidth - 16, targetRect.x + targetRect.width / 2 - cardWidth / 2));
  const cardY = isTargetTop
    ? Math.min(viewport.h - 430, targetRect.y + targetRect.height + 24)
    : Math.max(16, targetRect.y - 420);

  // Coordonnées du faisceau laser
  const laserStartX = cardX + cardWidth / 2;
  const laserStartY = isTargetTop ? cardY : cardY + 380;
  const laserEndX = targetRect.x + targetRect.width / 2;
  const laserEndY = isTargetTop ? targetRect.y + targetRect.height : targetRect.y;

  return (
    <div className="fixed inset-0 z-50 pointer-events-auto font-mono select-none overflow-hidden">
      
      {/* 1. DÉCOUPE PHYSIQUE AU LASER (Masque SVG Spotlight) */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        <defs>
          <mask id="master-spotlight-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            <rect
              x={targetRect.x}
              y={targetRect.y}
              width={targetRect.width}
              height={targetRect.height}
              rx="12"
              fill="black"
              className="transition-all duration-500 ease-out"
            />
          </mask>
        </defs>

        {/* Fond sombre et flouté avec trou transparent */}
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="#070B14"
          fillOpacity="0.84"
          mask="url(#master-spotlight-mask)"
          className="backdrop-blur-md"
        />

        {/* Réticule de visée doré autour de l'élément inspecté */}
        <rect
          x={targetRect.x}
          y={targetRect.y}
          width={targetRect.width}
          height={targetRect.height}
          rx="12"
          fill="none"
          stroke="#f59e0b"
          strokeWidth="2.5"
          strokeDasharray="8 6"
          className="transition-all duration-500 ease-out"
        />

        {/* Faisceau laser dynamique entre la carte et le bouton */}
        {targetRect.found && (
          <g>
            <line
              x1={laserStartX}
              y1={laserStartY}
              x2={laserEndX}
              y2={laserEndY}
              stroke="#f59e0b"
              strokeWidth="2"
              strokeDasharray="6 4"
              opacity="0.85"
            />
            <circle cx={laserEndX} cy={laserEndY} r="5" fill="#fbbf24">
              <animate attributeName="r" values="3;8;3" dur="1.2s" repeatCount="indefinite" />
            </circle>
          </g>
        )}
      </svg>

      {/* 2. CONSOLE HUD INTERACTIVE ULTRA-DÉTAILLÉE */}
      <div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          transform: `translate3d(${cardX}px, ${cardY}px, 0)`,
          width: `${cardWidth}px`,
        }}
        className="absolute top-0 left-0 bg-[#0F172A]/98 border-2 border-amber-500/80 rounded-2xl p-5 sm:p-6 shadow-[0_0_50px_rgba(245,158,11,0.25)] backdrop-blur-2xl text-slate-200 transition-transform duration-500 ease-out"
      >
        {/* Barre de décompte automatique */}
        {isPlaying && !isHovered && !showChaptersMenu && (
          <div
            key={currentIdx}
            style={{ animationDuration: `${AUTOPLAY_STEP_MS}ms` }}
            className="absolute top-0 left-0 h-1 bg-gradient-to-r from-amber-500 via-cyan-400 to-amber-500 w-full animate-[progress_linear]"
          />
        )}

        {/* Barre supérieure : Index du chapitre & Contrôles */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4 text-[11px]">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/40 font-bold">
              CHAPITRE {step.chapterNumber} / 08
            </span>
            <button
              type="button"
              onClick={() => setShowChaptersMenu(!showChaptersMenu)}
              className="text-slate-400 hover:text-white underline underline-offset-4 cursor-pointer"
            >
              {showChaptersMenu ? "Fermer le sommaire" : "Voir les 8 chapitres ▾"}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsPlaying(!isPlaying)}
              title={isPlaying ? "Mettre en pause le défilement" : "Reprendre le défilement automatique"}
              className="p-1.5 hover:text-amber-400 text-slate-400 rounded-lg bg-slate-900 border border-slate-800 transition-colors cursor-pointer"
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 text-emerald-400" />}
            </button>

            <button
              type="button"
              onClick={onClose}
              title="Quitter le guide"
              className="p-1.5 hover:text-white text-slate-400 rounded-lg bg-slate-900 border border-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Sommaire déroulant pour aller directement à un chapitre */}
        {showChaptersMenu && (
          <div className="mb-4 p-3 bg-slate-950 border border-slate-800 rounded-xl max-h-48 overflow-y-auto space-y-1">
            <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Accès direct aux chapitres :</div>
            {TOUR_CHAPTERS.map((ch, idx) => (
              <button
                key={ch.id}
                type="button"
                onClick={() => {
                  setCurrentIdx(idx);
                  setShowChaptersMenu(false);
                }}
                className={`w-full text-left px-2.5 py-1.5 rounded text-xs transition-colors flex items-center justify-between cursor-pointer ${
                  idx === currentIdx
                    ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <span>{ch.chapterNumber}. {ch.title}</span>
                <span className="text-[10px] opacity-60">{ch.badge.split(' // ')[0]}</span>
              </button>
            ))}
          </div>
        )}

        {/* En-tête du module en cours */}
        <div className="flex items-start gap-3.5 mb-3.5">
          <div className="p-2.5 bg-[#0B1120] border border-slate-800 rounded-xl shadow-inner shrink-0">
            {step.icon}
          </div>
          <div className="min-w-0">
            <span className="text-[10px] text-cyan-400 font-bold tracking-widest block truncate">
              {step.badge}
            </span>
            <h3 className="text-base sm:text-lg font-bold text-white font-sans mt-0.5 tracking-tight">
              {step.title}
            </h3>
          </div>
        </div>

        {/* Les 3 Blocs Pédagogiques Ultra-Détaillés */}
        <div className="space-y-2.5 text-xs font-sans mb-4">
          
          {/* Bloc 1 : Rôle */}
          <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800">
            <span className="text-amber-400 font-bold font-mono text-[11px] block mb-0.5">
              🎯 À QUOI ÇA SERT :
            </span>
            <p className="text-slate-300 leading-relaxed text-[12px]">
              {step.role}
            </p>
          </div>

          {/* Bloc 2 : Comment l'utiliser */}
          <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800">
            <span className="text-cyan-400 font-bold font-mono text-[11px] flex items-center gap-1.5 mb-0.5">
              <MousePointer className="w-3.5 h-3.5" />
              <span>COMMENT L'UTILISER :</span>
            </span>
            <p className="text-slate-300 leading-relaxed text-[12px] whitespace-pre-line font-mono">
              {step.howToUse}
            </p>
          </div>

          {/* Bloc 3 : Bénéfice métier */}
          <div className="p-2 rounded-lg bg-emerald-950/40 border border-emerald-800/60 text-[11px] text-emerald-300 flex items-start gap-2">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
            <span><strong>Bénéfice :</strong> {step.businessBenefit}</span>
          </div>

        </div>

        {/* Pied de boîte : Navigation pas-à-pas */}
        <div className="flex items-center justify-between border-t border-slate-800/80 pt-3 text-xs">
          
          {/* Points de progression cliquables */}
          <div className="flex items-center gap-1.5">
            {TOUR_CHAPTERS.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentIdx(idx)}
                className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                  idx === currentIdx
                    ? 'w-6 bg-amber-400'
                    : 'w-1.5 bg-slate-700 hover:bg-slate-500'
                }`}
              />
            ))}
          </div>

          {/* Boutons Suivant / Précédent */}
          <div className="flex items-center gap-2">
            {!isFirst && (
              <button
                type="button"
                onClick={() => setCurrentIdx((p) => p - 1)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-sans transition-colors flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Précédent</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                if (isLast) onClose();
                else setCurrentIdx((p) => p + 1);
              }}
              className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-bold rounded-lg text-xs font-sans transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-amber-500/20"
            >
              <span>{isLast ? "Prêt à utiliser !" : "Suivant"}</span>
              {isLast ? <Check className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
            </button>
          </div>

        </div>

      </div>

    </div>
  );
};