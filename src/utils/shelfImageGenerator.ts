export interface SampleShelfPhotoPreset {
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  itemsPreview: Array<{
    ref: string;
    name: string;
    qty: string;
    dim: string;
    boxColor: string;
  }>;
}

export const SAMPLE_SHELF_PRESETS: SampleShelfPhotoPreset[] = [
  {
    id: 'preset-electronique',
    title: 'Lot Électronique & Automatisme Général (3 Cases)',
    subtitle: 'Étiquettes SKU-ELC-104, ELC-208, ELC-312',
    badge: 'Rayonnage Électronique · Modules & Capteurs',
    itemsPreview: [
      {
        ref: 'SKU-ELC-104',
        name: 'Module Automate Programmable',
        qty: 'QTY: 18 PCS',
        dim: '35x28x20 cm (Carton M)',
        boxColor: '#0f766e',
      },
      {
        ref: 'SKU-ELC-208',
        name: 'Alimentation Industrielle 24V',
        qty: 'QTY: 26 PCS',
        dim: '28x20x15 cm (Bac S)',
        boxColor: '#1e3a8a',
      },
      {
        ref: 'SKU-ELC-312',
        name: 'Coupleur Réseau Industriel',
        qty: 'QTY: 34 PCS',
        dim: '26x18x14 cm (Bac S)',
        boxColor: '#312e81',
      },
    ],
  },
  {
    id: 'preset-mecanique',
    title: 'Lot Mécanique & Transmission (3 Cases)',
    subtitle: 'Étiquettes SKU-MEC-551, MEC-662, MEC-773',
    badge: 'Rayonnage Mécanique · Variateurs & Moteurs',
    itemsPreview: [
      {
        ref: 'SKU-MEC-551',
        name: 'Variateur de Vitesse Universel',
        qty: 'QTY: 11 PCS',
        dim: '48x36x28 cm (Caisse L)',
        boxColor: '#7c2d12',
      },
      {
        ref: 'SKU-MEC-662',
        name: 'Écran IHM Tactile 7 pouces',
        qty: 'QTY: 15 PCS',
        dim: '38x30x22 cm (Carton M)',
        boxColor: '#1e40af',
      },
      {
        ref: 'SKU-MEC-773',
        name: 'Servomoteur Brushless 400W',
        qty: 'QTY: 22 PCS',
        dim: '34x26x20 cm (Carton M)',
        boxColor: '#065f46',
      },
    ],
  },
  {
    id: 'preset-quincaillerie',
    title: 'Lot Quincaillerie & Fournitures Générales (3 Cases)',
    subtitle: 'Étiquettes SKU-IND-012, IND-034, IND-056',
    badge: 'Rayonnage Quincaillerie · Raccords & Fixations',
    itemsPreview: [
      {
        ref: 'SKU-IND-012',
        name: 'Relais de Puissance 25A',
        qty: 'QTY: 48 PCS',
        dim: '24x16x14 cm (Bac S)',
        boxColor: '#0f766e',
      },
      {
        ref: 'SKU-IND-034',
        name: 'Disjoncteur Modulaire Rail-DIN',
        qty: 'QTY: 36 PCS',
        dim: '24x16x14 cm (Bac S)',
        boxColor: '#4c1d95',
      },
      {
        ref: 'SKU-IND-056',
        name: 'Coffret Borniers Industriels',
        qty: 'QTY: 30 PCS',
        dim: '32x24x18 cm (Carton M)',
        boxColor: '#854d0e',
      },
    ],
  },
];

/**
 * Génère une étagère industrielle générale avec étiquettes codes-barres neutres
 */
export function renderSampleShelfPhotoDataUrl(
  presetId: string,
  cabinetCode: string,
  shelfIndex: number
): string {
  const preset =
    SAMPLE_SHELF_PRESETS.find((p) => p.id === presetId) || SAMPLE_SHELF_PRESETS[0];

  const canvas = document.createElement('canvas');
  canvas.width = 960;
  canvas.height = 540;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Fond d'entrepôt sombre
  const grad = ctx.createLinearGradient(0, 0, 0, 540);
  grad.addColorStop(0, '#0f172a');
  grad.addColorStop(1, '#1e293b');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 960, 540);

  // Montants verticaux en acier
  ctx.fillStyle = '#334155';
  ctx.fillRect(24, 0, 32, 540);
  ctx.fillRect(904, 0, 32, 540);

  // Lisses horizontales orange de sécurité
  ctx.fillStyle = '#ea580c';
  ctx.fillRect(24, 44, 912, 34);
  ctx.fillRect(24, 446, 912, 42);

  // Marquages neutres sur les lisses
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 16px "JetBrains Mono", monospace';
  ctx.fillText(
    `RAYONNAGE: ${cabinetCode}   |   ÉTAGÈRE E${shelfIndex}   |   SCAN OPTIQUE DE STOCK`,
    72,
    67
  );
  ctx.fillText(
    `GESTION D'ENTREPÔT GÉNÉRAL & LOGISTIQUE   ·   CERTIFIÉ ISO-9001`,
    72,
    473
  );

  // Dessin des 3 casiers/bacs
  preset.itemsPreview.forEach((item, idx) => {
    const x = 74 + idx * 278;
    const y = 115;
    const w = 256;
    const h = 330;

    // Séparateur métallique
    if (idx > 0) {
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x - 11, 78);
      ctx.lineTo(x - 11, 446);
      ctx.stroke();
    }

    // Bac / Carton
    ctx.fillStyle = item.boxColor;
    ctx.fillRect(x, y, w, h);

    // Rebord supérieur
    ctx.fillStyle = 'rgba(255,255,255,0.14)';
    ctx.fillRect(x, y, w, 18);

    // Étiquette blanche industrielle standard
    const lx = x + 18;
    const ly = y + 42;
    const lw = w - 36;
    const lh = 225;
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(lx, ly, lw, lh);

    // En-tête de l'étiquette
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(lx, ly, lw, 32);
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 13px "JetBrains Mono", monospace';
    ctx.fillText(`COLIS · ${cabinetCode}-E${shelfIndex}-C${idx + 1}`, lx + 10, ly + 21);

    // Référence SKU en gras
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 19px "JetBrains Mono", monospace';
    ctx.fillText(item.ref, lx + 12, ly + 66);

    // Désignation article
    ctx.fillStyle = '#334155';
    ctx.font = '600 13px sans-serif';
    ctx.fillText(item.name, lx + 12, ly + 92);

    // Quantité et gabarit
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 14px "JetBrains Mono", monospace';
    ctx.fillText(item.qty, lx + 12, ly + 122);
    ctx.fillStyle = '#475569';
    ctx.font = '12px "JetBrains Mono", monospace';
    ctx.fillText(`DIM: ${item.dim}`, lx + 12, ly + 144);

    // Code-barres universel
    const bx = lx + 14;
    const by = ly + 162;
    ctx.fillStyle = '#0f172a';
    for (let b = 0; b < 34; b++) {
      const barW = (b * 7 + idx * 3) % 3 === 0 ? 4 : 2;
      ctx.fillRect(bx + b * 5.6, by, barW, 42);
    }

    // Bounding box verte de détection IA
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(lx - 4, ly - 4, lw + 8, lh + 8);
  });

  return canvas.toDataURL('image/png');
}