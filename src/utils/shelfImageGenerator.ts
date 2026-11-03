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
    id: 'preset-siemens-simatic',
    title: 'Lot Siemens SIMATIC S7-1500 & ET 200SP (3 Cases)',
    subtitle: 'Étiquettes MLFB 6ES7511-1AK02, 6ES7214-1AG40, 6ES7155-6AU01',
    badge: 'Étagère Siemens · Automates & I/O',
    itemsPreview: [
      {
        ref: '6ES7511-1AK02',
        name: 'Siemens CPU 1511-1 PN',
        qty: 'QTY: 18 PCS',
        dim: '35x28x20 cm (Carton M)',
        boxColor: '#0f766e',
      },
      {
        ref: '6ES7214-1AG40',
        name: 'Siemens S7-1200 CPU 1214C',
        qty: 'QTY: 26 PCS',
        dim: '28x20x15 cm (Bac S)',
        boxColor: '#1e3a8a',
      },
      {
        ref: '6ES7155-6AU01',
        name: 'Siemens Coupleur ET 200SP',
        qty: 'QTY: 34 PCS',
        dim: '26x18x14 cm (Bac S)',
        boxColor: '#312e81',
      },
    ],
  },
  {
    id: 'preset-siemens-sinamics',
    title: 'Lot Siemens SINAMICS Variateurs & HMI (3 Cases)',
    subtitle: 'Étiquettes MLFB 6SL3210-1KE14, 6AV2123-2GB03, 6EP3334-7SB00',
    badge: 'Étagère Siemens · Variateurs & IHM',
    itemsPreview: [
      {
        ref: '6SL3210-1KE14',
        name: 'Siemens SINAMICS G120C',
        qty: 'QTY: 11 PCS',
        dim: '48x36x28 cm (Caisse L)',
        boxColor: '#7c2d12',
      },
      {
        ref: '6AV2123-2GB03',
        name: 'Siemens HMI KTP700 7"',
        qty: 'QTY: 15 PCS',
        dim: '38x30x22 cm (Carton M)',
        boxColor: '#1e40af',
      },
      {
        ref: '6EP3334-7SB00',
        name: 'Siemens SITOP PSU6200',
        qty: 'QTY: 22 PCS',
        dim: '34x26x20 cm (Carton M)',
        boxColor: '#065f46',
      },
    ],
  },
  {
    id: 'preset-siemens-sirius',
    title: 'Lot Siemens SIRIUS Contacteurs & Disjoncteurs (3 Cases)',
    subtitle: 'Étiquettes MLFB 3RT2026-1BB40, 3RV2021-4AA10, 5SY4216-7',
    badge: 'Étagère Siemens · Départs Moteurs',
    itemsPreview: [
      {
        ref: '3RT2026-1BB40',
        name: 'Siemens Contacteur 25A',
        qty: 'QTY: 48 PCS',
        dim: '24x16x14 cm (Bac S)',
        boxColor: '#0f766e',
      },
      {
        ref: '3RV2021-4AA10',
        name: 'Siemens Disj. Moteur S0',
        qty: 'QTY: 36 PCS',
        dim: '24x16x14 cm (Bac S)',
        boxColor: '#4c1d95',
      },
      {
        ref: '5SY4216-7',
        name: 'Siemens Sentron 16A 2P',
        qty: 'QTY: 30 PCS',
        dim: '32x24x18 cm (Carton M)',
        boxColor: '#854d0e',
      },
    ],
  },
];

/**
 * Generates a realistic high-contrast industrial Siemens shelf & barcode label image as a base64 PNG
 * so Gemini Vision API can read the actual visual labels and the user can preview the exact shelf capture.
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

  // Dark industrial rack backdrop
  const grad = ctx.createLinearGradient(0, 0, 0, 540);
  grad.addColorStop(0, '#0f172a');
  grad.addColorStop(1, '#1e293b');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 960, 540);

  // Vertical steel uprights (blue/slate)
  ctx.fillStyle = '#334155';
  ctx.fillRect(24, 0, 32, 540);
  ctx.fillRect(904, 0, 32, 540);

  // Horizontal safety orange load beams
  ctx.fillStyle = '#ea580c';
  ctx.fillRect(24, 44, 912, 34);
  ctx.fillRect(24, 446, 912, 42);

  // Beam stencil markings
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 16px "JetBrains Mono", monospace';
  ctx.fillText(
    `ARMOIRE SIEMENS: ${cabinetCode}   |   ÉTAGÈRE E${shelfIndex}   |   SCAN OPTIQUE MLFB IA`,
    72,
    67
  );
  ctx.fillText(
    `SIEMENS LOGISTIQUE PIÈCES DE RECHANGE   ·   CERTIFIÉ ISO-9001`,
    72,
    473
  );

  // Draw 3 compartment bins / crates sitting on the shelf
  preset.itemsPreview.forEach((item, idx) => {
    const x = 74 + idx * 278;
    const y = 115;
    const w = 256;
    const h = 330;

    // Bin divider line
    if (idx > 0) {
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x - 11, 78);
      ctx.lineTo(x - 11, 446);
      ctx.stroke();
    }

    // Crate body
    ctx.fillStyle = item.boxColor;
    ctx.fillRect(x, y, w, h);

    // Crate top rim highlight
    ctx.fillStyle = 'rgba(255,255,255,0.14)';
    ctx.fillRect(x, y, w, 18);

    // White industrial shipping/inventory label sticker
    const lx = x + 18;
    const ly = y + 42;
    const lw = w - 36;
    const lh = 225;
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(lx, ly, lw, lh);

    // Label header bar (Siemens Petrol Teal)
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(lx, ly, lw, 32);
    ctx.fillStyle = '#2dd4bf';
    ctx.font = 'bold 13px "JetBrains Mono", monospace';
    ctx.fillText(`SIEMENS · ${cabinetCode}-E${shelfIndex}-C${idx + 1}`, lx + 10, ly + 21);

    // SKU Reference in bold
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 19px "JetBrains Mono", monospace';
    ctx.fillText(item.ref, lx + 12, ly + 66);

    // Product Name
    ctx.fillStyle = '#334155';
    ctx.font = '600 13px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(item.name, lx + 12, ly + 92);

    // Quantity & Packaging Size
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 14px "JetBrains Mono", monospace';
    ctx.fillText(item.qty, lx + 12, ly + 122);
    ctx.fillStyle = '#475569';
    ctx.font = '12px "JetBrains Mono", monospace';
    ctx.fillText(`EMB: ${item.dim}`, lx + 12, ly + 144);

    // Procedural barcode bars
    const bx = lx + 14;
    const by = ly + 162;
    ctx.fillStyle = '#0f172a';
    for (let b = 0; b < 34; b++) {
      const barW = (b * 7 + idx * 3) % 3 === 0 ? 4 : 2;
      ctx.fillRect(bx + b * 5.6, by, barW, 42);
    }

    // Green AI detection bounding box overlay
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(lx - 4, ly - 4, lw + 8, lh + 8);
  });

  return canvas.toDataURL('image/png');
}
