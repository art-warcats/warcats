import {MapPosition} from '..';

export abstract class GameEntity<S, T> {
  abstract _id: string;
  abstract path: S;
  abstract position: MapPosition;
  abstract getTeam(): T;

  setMapPosition = (position: MapPosition) => {
    this.position = position;
  };

  doesOverlap(entity: GameEntity<unknown, unknown>) {
    return this.onMapPosition(entity.position);
  }

  onMapPosition(mapPos2: MapPosition) {
    return this.position.x == mapPos2.x && this.position.y == mapPos2.y;
  }

  getMapPosition = () => {
    return this.position;
  };
}
