import {Scene} from 'babylonjs';
import {UnitSprite, BuildingSprite} from '../../game';
import {Building, Unit} from '@warcats/common';
import {AdvancedDynamicTexture} from 'babylonjs-gui';

function checkBuildingMapPosition(building: Building, buildings: Building[]) {
  const matchingMapPosition = buildings.find((building2: Building) =>
    building.doesOverlap(building2),
  );
  if (matchingMapPosition != null) {
    console.error('overlapping building', matchingMapPosition);
    throw new Error('Trying to place buildings on top of each other ');
  }
}

function checkUnitMapPositon(unit: Unit, units: Unit[], buildings: Building[]) {
  const matchingUnitPosition = units.find((unit2) => unit.doesOverlap(unit2));
  const matchingBuildingPosition = buildings.find((building) =>
    building.doesOverlap(unit),
  );

  if (matchingUnitPosition != null || matchingBuildingPosition != null) {
    console.error(
      'overlapping',
      matchingUnitPosition,
      matchingBuildingPosition,
    );
    throw new Error('Overlapping unit with something ');
  }

  if (!unit.canWalkAt(unit.getMapPosition())) {
    throw new Error("Trying to put a unit where it can't walk");
  }
}

export class WarCatSpriteFactory {
  scene: Scene;
  buildings: Building[] = [];
  units: Unit[] = [];

  constructor(scene: Scene) {
    this.scene = scene;
  }

  createBuilding(building: Building, uiTexture: AdvancedDynamicTexture) {
    // checkBuildingMapPosition(building, this.buildings);

    const buildingSprite = new BuildingSprite(building, this.scene, uiTexture);

    this.buildings.push(building);

    return buildingSprite;
  }

  createUnit(unit: Unit, uiTexture: AdvancedDynamicTexture) {
    console.log('placing unit', unit);
    // checkUnitMapPositon(unit, this.units, this.buildings);

    const unitSprite = new UnitSprite(unit, this.scene, uiTexture);
    this.units.push(unit);
    return unitSprite;
  }
}
