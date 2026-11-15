// import React, { useState, useEffect, useRef } from 'react';
// import { 
//   X, 
//   ArrowRight, 
//   ArrowLeft, 
//   Check, 
//   Layers, 
//   ScanLine, 
//   Compass, 
//   Flame, 
//   Sparkles,
//   Play,
//   Pause
// } from 'lucide-react';

// interface TourStep {
//   title: string;
//   badge: string;
//   description: string;
//   tip: string;
//   position: 'center' | 'top-center' | 'top-left' | 'bottom-center' | 'top-right';
//   arrowDirection: 'up' | 'down' | 'left' | 'right' | 'none';
//   icon: React.ReactNode;
// }

// const TOUR_STEPS: TourStep[] = [
//   {
//     title: "Bienvenue dans OptiStock 3D !",
//     badge: "Jumeau Numérique Industriel",
//     description: "Pilotez l'ensemble de votre entrepôt en 3D temps réel. Naviguez dans les allées, personnalisez vos étagères et suivez vos stocks au centimètre près.",
//     tip: "Regardez la flèche se déplacer automatiquement pour découvrir les fonctionnalités.",
//     position: 'center',
//     arrowDirection: 'none',
//     icon: <Sparkles className="w-6 h-6 text-amber-400" />,
//   },
//   {
//     title: "1. Navigation & Modules Principaux",
//     badge: "Barre Supérieure",
//     description: "Accédez en un clic à vos modules : Plan 2D d'agencement, Entrepôt 3D, Scanner optique par caméra et Analyse de rotation.",
//     tip: "Le bouton jaune à droite permet de configurer les casiers inégaux en 2D.",
//     position: 'top-center',
//     arrowDirection: 'up',
//     icon: <Layers className="w-6 h-6 text-cyan-400" />,
//   },
//   {
//     title: "2. Fiche Technique de Casier",
//     badge: "Inspecteur d'Emplacement",
//     description: "En cliquant sur n'importe quel casier d'une armoire 3D, cette fiche affiche la référence SKU, la quantité, les dimensions et le contrôle volumétrique.",
//     tip: "Vous pouvez directement réorganiser les cases ou éditer les articles depuis cette fenêtre.",
//     position: 'top-left',
//     arrowDirection: 'left',
//     icon: <Compass className="w-6 h-6 text-amber-400" />,
//   },
//   {
//     title: "3. Caméras 3D & Cartes Thermiques",
//     badge: "Dock de Contrôle Inférieur",
//     description: "Changez d'angle instantanément (Vue Globale, Allée Centrale) et activez la Carte Thermique de Rotation (ABC) pour colorer en rouge les produits les plus prélevés.",
//     tip: "Le mode 'Alertes Stock' met en évidence les casiers proches de la rupture.",
//     position: 'bottom-center',
//     arrowDirection: 'down',
//     icon: <Flame className="w-6 h-6 text-orange-400" />,
//   },
//   {
//     title: "4. Scanner Optique de Rayonnage",
//     badge: "Vision & Inventaire Automatique",
//     description: "Photographiez une étagère réelle : le système extrait instantanément les codes articles et les gabarits de colis pour les affecter automatiquement aux cases 3D.",
//     tip: "Accessible via l'onglet 'Scanner IA' dans la barre supérieure.",
//     position: 'top-right',
//     arrowDirection: 'up',
//     icon: <ScanLine className="w-6 h-6 text-emerald-400" />,
//   },
// ];

// const STEP_DURATION = 4500; // 4.5 secondes par étape avant déplacement automatique

// interface InteractiveAppTourProps {
//   isOpen: boolean;
//   onClose: () => void;
// }

// export const InteractiveAppTour: React.FC<InteractiveAppTourProps> = ({ isOpen, onClose }) => {
//   const [currentStepIndex, setCurrentStepIndex] = useState(0);
//   const [isAutoPlaying, setIsAutoPlaying] = useState(true);
//   const [isHovered, setIsHovered] = useState(false);
//   const timerRef = useRef<number | null>(null);

//   // Réinitialiser au début à chaque ouverture
//   useEffect(() => {
//     if (isOpen) {
//       setCurrentStepIndex(0);
//       setIsAutoPlaying(true);
//     }
//   }, [isOpen]);

//   // Déplacement automatique de la flèche
//   useEffect(() => {
//     if (!isOpen || !isAutoPlaying || isHovered) {
//       if (timerRef.current) clearInterval(timerRef.current);
//       return;
//     }

//     timerRef.current = window.setInterval(() => {
//       setCurrentStepIndex((prevIndex) => {
//         if (prevIndex >= TOUR_STEPS.length - 1) {
//           // Reboucle au début ou termine
//           return 0;
//         }
//         return prevIndex + 1;
//       });
//     }, STEP_DURATION);

//     return () => {
//       if (timerRef.current) clearInterval(timerRef.current);
//     };
//   }, [isOpen, isAutoPlaying, isHovered, currentStepIndex]);

//   if (!isOpen) return null;

//   const step = TOUR_STEPS[currentStepIndex];
//   const isFirst = currentStepIndex === 0;
//   const isLast = currentStepIndex === TOUR_STEPS.length - 1;

//   const handleNext = () => {
//     if (isLast) {
//       onClose();
//     } else {
//       setCurrentStepIndex((prev) => prev + 1);
//     }
//   };

//   const handlePrev = () => {
//     if (!isFirst) {
//       setCurrentStepIndex((prev) => prev - 1);
//     }
//   };

//   // Coordonnées de déplacement fluide de la boîte et de la flèche
//   const getPositionClasses = () => {
//     switch (step.position) {
//       case 'top-center':
//         return 'top-20 left-1/2 -translate-x-1/2';
//       case 'top-left':
//         return 'top-24 left-6 sm:left-12';
//       case 'top-right':
//         return 'top-20 right-6 sm:right-12';
//       case 'bottom-center':
//         return 'bottom-28 left-1/2 -translate-x-1/2';
//       case 'center':
//       default:
//         return 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2';
//     }
//   };

//   return (
//     <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-auto">
//       {/* 1. ARRIÈRE-PLAN SOMBRE ET FLOU */}
//       <div 
//         onClick={onClose}
//         className="fixed inset-0 bg-[#0B1120]/75 backdrop-blur-md transition-all duration-700 animate-fadeIn" 
//       />

//       {/* 2. BOÎTE DU GUIDE QUI GLISSE AUTOMATIQUEMENT */}
//       <div 
//         onMouseEnter={() => setIsHovered(true)}
//         onMouseLeave={() => setIsHovered(false)}
//         className={`fixed z-50 w-[92vw] max-w-lg transition-all duration-700 ease-in-out ${getPositionClasses()}`}
//       >
        
//         {/* FLÈCHE ANIMÉE POINTANT VERS LE HAUT */}
//         {step.arrowDirection === 'up' && (
//           <div className="flex justify-center -mb-2.5">
//             <div className="w-0 h-0 border-x-8 border-x-transparent border-b-[10px] border-b-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.8)] animate-bounce" />
//           </div>
//         )}

//         {/* FLÈCHE ANIMÉE POINTANT VERS LA GAUCHE */}
//         {step.arrowDirection === 'left' && (
//           <div className="absolute -left-3.5 top-12">
//             <div className="w-0 h-0 border-y-8 border-y-transparent border-r-[10px] border-r-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.8)] animate-pulse" />
//           </div>
//         )}

//         <div className="bg-[#0F172A] border-2 border-amber-500/80 rounded-2xl p-6 shadow-2xl shadow-amber-500/15 text-slate-200 relative overflow-hidden backdrop-blur-xl">
          
//           {/* BARRE DE PROGRESSION ANIMÉE (Décompte automatique) */}
//           {isAutoPlaying && !isHovered && (
//             <div 
//               key={currentStepIndex}
//               style={{ animationDuration: `${STEP_DURATION}ms` }}
//               className="absolute top-0 left-0 h-1 bg-gradient-to-r from-amber-500 via-cyan-400 to-amber-500 w-full animate-[progress_linear]"
//             />
//           )}

//           {/* En-tête */}
//           <div className="flex items-start justify-between gap-3 mb-4 pt-1">
//             <div className="flex items-center gap-3">
//               <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 shadow-inner">
//                 {step.icon}
//               </div>
//               <div>
//                 <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold block">
//                   {step.badge}
//                 </span>
//                 <h3 className="text-base sm:text-lg font-bold text-white font-display mt-0.5">
//                   {step.title}
//                 </h3>
//               </div>
//             </div>

//             <div className="flex items-center gap-1">
//               {/* Bouton Pause / Reprendre le défilement automatique */}
//               <button
//                 type="button"
//                 onClick={() => setIsAutoPlaying(!isAutoPlaying)}
//                 className="p-1.5 text-slate-400 hover:text-amber-400 rounded-lg hover:bg-slate-800 transition-colors"
//                 title={isAutoPlaying ? "Mettre en pause le déplacement automatique" : "Reprendre le déplacement automatique"}
//               >
//                 {isAutoPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 text-emerald-400" />}
//               </button>

//               <button
//                 type="button"
//                 onClick={onClose}
//                 title="Quitter le guide"
//                 className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
//               >
//                 <X className="w-4 h-4" />
//               </button>
//             </div>
//           </div>

//           {/* Description */}
//           <p className="text-sm text-slate-300 leading-relaxed mb-4">
//             {step.description}
//           </p>

//           {/* Conseil pratique */}
//           <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 text-xs text-amber-300/90 font-mono mb-5 flex items-start gap-2">
//             <span className="text-amber-400 font-bold shrink-0">💡 ASTUCE :</span>
//             <span>{step.tip}</span>
//           </div>

//           {/* Pied de dialogue : Navigation & Compteur */}
//           <div className="flex items-center justify-between pt-3 border-t border-slate-800 text-xs">
            
//             {/* Indicateurs de progression */}
//             <div className="flex items-center gap-1.5">
//               {TOUR_STEPS.map((_, idx) => (
//                 <button
//                   key={idx}
//                   type="button"
//                   onClick={() => setCurrentStepIndex(idx)}
//                   className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
//                     idx === currentStepIndex
//                       ? 'w-6 bg-amber-400'
//                       : 'w-1.5 bg-slate-700 hover:bg-slate-500'
//                   }`}
//                 />
//               ))}
//               <span className="text-[10px] font-mono text-slate-400 ml-2">
//                 {currentStepIndex + 1}/{TOUR_STEPS.length}
//               </span>
//             </div>

//             {/* Boutons Suivant / Précédent */}
//             <div className="flex items-center gap-2">
//               {!isFirst && (
//                 <button
//                   type="button"
//                   onClick={handlePrev}
//                   className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors flex items-center gap-1 cursor-pointer font-medium"
//                 >
//                   <ArrowLeft className="w-3.5 h-3.5" />
//                   <span>Précédent</span>
//                 </button>
//               )}

//               <button
//                 type="button"
//                 onClick={handleNext}
//                 className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-amber-500/20"
//               >
//                 <span>{isLast ? "Terminer" : "Suivant"}</span>
//                 {isLast ? <Check className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
//               </button>
//             </div>

//           </div>

//         </div>

//         {/* FLÈCHE ANIMÉE POINTANT VERS LE BAS */}
//         {step.arrowDirection === 'down' && (
//           <div className="flex justify-center -mt-2.5">
//             <div className="w-0 h-0 border-x-8 border-x-transparent border-t-[10px] border-t-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.8)] animate-bounce" />
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };
