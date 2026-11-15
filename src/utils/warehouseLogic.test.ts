import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createInitialWarehouseCabinets,
  createCabinet,
  updateCabinetStructure,
  deleteCabinet,
  upsertBinProduct,
  removeBinProduct,
  adjustBinQuantity,
  associateScannedItemsToCabinetShelf,
  computeWarehouseAnalytics,
  generateSlottingRecommendations,
  applySlottingRecommendations,
  searchWarehouseBins,
  DEFAULT_ROOM_DIMENSIONS,
  DEFAULT_SIEMENS_EXCEL_CATALOG,
  createCabinetFrom2DRectangle,
  clampCabinetPositionToRoom,
  checkCabinetCollision,
  moveOrSwapBins,
  addBinToShelf,
  removeBinFromShelf,
  resizeShelfBinDivider,
  getShelfBinsWithGeometry,
  autoOrganizeSiemensProductsInCabinet,
} from './warehouseLogic';

test('initial warehouse creates 5 cabinets with unequal shelf cases and packaging sizes', () => {
  const cabinets = createInitialWarehouseCabinets();
  assert.equal(cabinets.length, 5);
  const analytics = computeWarehouseAnalytics(cabinets);
  assert.ok(analytics.totalBins >= 50);
  assert.ok(analytics.occupiedBins >= 15);
  assert.ok(analytics.avgTurnoverRate > 10);

  // Verify ARM-A1 has unequal number of cases across its shelves (E1=2, E2=3, E3=4, E4=5)
  const armA1 = cabinets[0];
  const e1Geoms = getShelfBinsWithGeometry(armA1, 1);
  const e2Geoms = getShelfBinsWithGeometry(armA1, 2);
  const e3Geoms = getShelfBinsWithGeometry(armA1, 3);
  const e4Geoms = getShelfBinsWithGeometry(armA1, 4);
  assert.equal(e1Geoms.length, 2);
  assert.equal(e2Geoms.length, 3);
  assert.equal(e3Geoms.length, 4);
  assert.equal(e4Geoms.length, 5);
  assert.ok(e1Geoms[0].widthCm > e1Geoms[1].widthCm, 'E1 C1 (55%) is wider than E1 C2 (45%)');
});

test('createCabinet, updateCabinetStructure, and deleteCabinet manage shelves and cases dynamically', () => {
  const initial = createInitialWarehouseCabinets();
  const newCab = createCabinet({
    code: 'arm-d1',
    name: 'Armoire D1 — Outillage & Pneumatique',
    zone: 'Zone D',
    position: { x: 0, z: 0 },
    shelvesCount: 3,
    columnsCount: 4,
  });

  assert.equal(newCab.code, 'ARM-D1');
  assert.equal(newCab.bins.length, 12);

  const withAdded = [...initial, newCab];
  const resized = updateCabinetStructure(withAdded, newCab.id, {
    shelvesCount: 5,
    columnsCount: 5,
  });
  const updatedCab = resized.find((c) => c.id === newCab.id)!;
  assert.ok(updatedCab.shelvesCount === 5);

  const afterDelete = deleteCabinet(resized, newCab.id);
  assert.equal(afterDelete.length, initial.length);
});

test('addBinToShelf, removeBinFromShelf, and resizeShelfBinDivider manipulate unequal cases in 2D', () => {
  let cabinets = createInitialWarehouseCabinets();
  const cabId = cabinets[0].id; // ARM-A1, Shelf 1 starts with 2 cases

  cabinets = addBinToShelf(cabinets, cabId, 1);
  assert.equal(getShelfBinsWithGeometry(cabinets[0], 1).length, 3);

  // Drag vertical divider between C1 and C2 on Shelf 1
  const beforeC1Width = getShelfBinsWithGeometry(cabinets[0], 1)[0].widthCm;
  cabinets = resizeShelfBinDivider(cabinets, cabId, 1, 1, 0.12);
  const afterC1Width = getShelfBinsWithGeometry(cabinets[0], 1)[0].widthCm;
  assert.ok(afterC1Width > beforeC1Width, 'Dragging divider right increases C1 width');

  cabinets = removeBinFromShelf(cabinets, cabId, 1);
  assert.equal(getShelfBinsWithGeometry(cabinets[0], 1).length, 2);
});

test('autoOrganizeSiemensProductsInCabinet places products by dimensions and turnover', () => {
  const cabinets = createInitialWarehouseCabinets();
  const targetCab = cabinets[1]; // ARM-A2
  const { updatedCabinets, placedCount } = autoOrganizeSiemensProductsInCabinet(
    cabinets,
    targetCab.id,
    DEFAULT_SIEMENS_EXCEL_CATALOG.slice(0, 8)
  );

  assert.equal(placedCount, 8);
  const updatedA2 = updatedCabinets.find((c) => c.id === targetCab.id)!;
  const shelf1Bins = updatedA2.bins.filter((b) => b.shelfIndex === 1 && b.product !== null);
  assert.ok(shelf1Bins.length >= 1, 'Heavy/large products placed on bottom shelf E1');
});

test('upsertBinProduct, adjustBinQuantity, and removeBinProduct modify bin contents', () => {
  let cabinets = createInitialWarehouseCabinets();
  const emptyBin = cabinets[0].bins.find((b) => b.product === null)!;

  cabinets = upsertBinProduct(cabinets, emptyBin.id, {
    reference: 'SKU-MOD-999',
    name: 'Module Test Réseau Ethernet',
    category: 'Électronique',
    quantity: 10,
    minThreshold: 3,
    maxCapacity: 25,
    packagingType: 'Carton Standard M',
    dimensionsCm: { lengthCm: 40, widthCm: 30, heightCm: 22 },
    weightKg: 2.5,
    turnoverRate: 15.4,
  });

  const updatedBin = cabinets[0].bins.find((b) => b.id === emptyBin.id)!;
  assert.equal(updatedBin.product?.reference, 'SKU-MOD-999');
  assert.equal(updatedBin.product?.quantity, 10);

  cabinets = adjustBinQuantity(cabinets, emptyBin.id, 5);
  assert.equal(cabinets[0].bins.find((b) => b.id === emptyBin.id)!.product?.quantity, 15);

  cabinets = removeBinProduct(cabinets, emptyBin.id);
  assert.equal(cabinets[0].bins.find((b) => b.id === emptyBin.id)!.product, null);
});

test('associateScannedItemsToCabinetShelf automatically populates target shelf bins from AI scan', () => {
  const cabinets = createInitialWarehouseCabinets();
  const targetCab = cabinets[0]; // ARM-A1

  const { updatedCabinets, assignedBinCodes } = associateScannedItemsToCabinetShelf(
    cabinets,
    targetCab.id,
    3,
    [
      {
        reference: 'SKU-CPU-518',
        name: 'Unité Centrale Haute Performance',
        category: 'Électronique',
        quantity: 22,
        packagingType: 'Bac Europe S',
        lengthCm: 30,
        widthCm: 20,
        heightCm: 15,
        turnoverRate: 19.2,
        targetColIndex: 1,
      },
      {
        reference: 'SKU-DRV-150',
        name: 'Variateur Industriel 1.5kW',
        category: 'Électronique',
        quantity: 8,
        packagingType: 'Caisse Renforcée L',
        lengthCm: 50,
        widthCm: 35,
        heightCm: 28,
        turnoverRate: 14.1,
        targetColIndex: 2,
      },
    ]
  );

  assert.equal(assignedBinCodes.length, 2);
  assert.ok(assignedBinCodes.includes('ARM-A1-E3-C1'));
  assert.ok(assignedBinCodes.includes('ARM-A1-E3-C2'));

  const results = searchWarehouseBins(updatedCabinets, 'SKU-CPU-518');
  assert.equal(results.length, 1);
  assert.equal(results[0].product?.scannedFromImage, true);
});

test('generateSlottingRecommendations and applySlottingRecommendations improve ergonomic slotting score', () => {
  const cabinets = createInitialWarehouseCabinets();
  const beforeAnalytics = computeWarehouseAnalytics(cabinets);
  const recs = generateSlottingRecommendations(cabinets);

  assert.ok(recs.length > 0, 'Should generate at least one slotting optimization recommendation');

  const optimizedCabinets = applySlottingRecommendations(cabinets, recs);
  const afterAnalytics = computeWarehouseAnalytics(optimizedCabinets);

  assert.ok(
    afterAnalytics.ergonomicSlottingScore >= beforeAnalytics.ergonomicSlottingScore,
    'Ergonomic slotting score should improve or stay optimal after applying recommendations'
  );
});

test('2D Floor Plan rectangle creation, room clamping, and collision detection work accurately', () => {
  const cabinets = createInitialWarehouseCabinets();
  const drawnCab = createCabinetFrom2DRectangle({
    startX: -2.0,
    startZ: 4.5,
    endX: 1.8,
    endZ: 5.5,
    existingCabinetsCount: cabinets.length,
    room: DEFAULT_ROOM_DIMENSIONS,
  });

  assert.equal(drawnCab.code, 'ARM-S6');
  assert.ok(drawnCab.columnsCount >= 3);
  assert.equal(drawnCab.rotationY, 0);

  const clamped = clampCabinetPositionToRoom(
    { x: 50, z: -50 },
    drawnCab,
    DEFAULT_ROOM_DIMENSIONS
  );
  assert.ok(clamped.x < DEFAULT_ROOM_DIMENSIONS.widthMeters / 2);
  assert.ok(clamped.z > -DEFAULT_ROOM_DIMENSIONS.depthMeters / 2);

  const collidingCab = {
    ...drawnCab,
    position: { ...cabinets[0].position },
  };
  const collisionCode = checkCabinetCollision(collidingCab, cabinets);
  assert.equal(collisionCode, 'ARM-A1');

  const bin1 = cabinets[0].bins[0];
  const initialRef = bin1.product?.reference || 'SKU-DRV-750';
  const binEmpty = cabinets[0].bins.find((b) => b.product === null)!;
  const swapped = moveOrSwapBins(cabinets, bin1.id, binEmpty.id);
  const updatedEmpty = swapped[0].bins.find((b) => b.id === binEmpty.id)!;
  assert.equal(updatedEmpty.product?.reference, initialRef);
});