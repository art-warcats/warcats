import {Scene, Sprite, SpriteManager, Vector3} from 'babylonjs';
import {
  MapPosition,
  tileSize,
  b1Buildings,
  Building,
  GameEntity,
  Unit,
} from '@warcats/common';
import {tileToWorldPosition} from '../helpers';

export class WarCatData {
  static redWarCat: any = {
    attributes: [
      {trait_type: 'Item', value: '9000'},
      {trait_type: 'Color', value: 'White'},
    ],
  };
  static purpleWarCat: any = {
    attributes: [
      {trait_type: 'Item', value: '9000'},
      {trait_type: 'Color', value: 'White'},
    ],
  };
}

export function getImageSize(entity: Building | Unit) {
  if (entity instanceof Building) {
    if (b1Buildings.includes(entity.path)) {
      return {width: 301, height: 659};
    } else {
      return {width: 301, height: 601};
    }
  } else if (entity instanceof Unit) {
    if (entity.path.endsWith('warcat')) {
      return {width: 480, height: 480};
    } else {
      return {width: 301, height: 601};
    }
  } else {
    console.error('Invalid entity ', entity, (entity as any).path);
    throw new Error('Invalid entity');
  }
}

export function getWarCatPath(entity: GameEntity<unknown, unknown>) {
  let warCat = WarCatData.redWarCat;
  if ((entity.path as string).startsWith('purple')) {
    warCat = WarCatData.purpleWarCat;
  }

  // const color = warCat.attributes.find(
  //   (attr: any) => attr.trait_type == 'cat'
  // ).value;
  const color = 'White';
  const item: string = warCat.attributes.find(
    (attr: any) => attr.trait_type === 'item',
  ).value;

  const finalItem = item === 'Samurai' ? 'Bazooka' : item;
  return `/pngs/cats/idle-${color
    .toLowerCase()
    .replaceAll(' ', '-')}-${finalItem.toLowerCase().replaceAll(' ', '-')}.png`;
}

export function getImagePath(entity: GameEntity<unknown, unknown>) {
  if ((entity.path as string).endsWith('warcat')) {
    return getWarCatPath(entity);
  } else {
    return '/pngs/' + entity.path + '.png';
  }
}

export function getSizes(entity: GameEntity<unknown, unknown>) {
  const imagePath = getImagePath(entity);
  const imageSize = getImageSize(entity as any);
  const gameSize = {
    width: tileSize.width,
    height: (tileSize.width * imageSize.height) / imageSize.width,
  };
  return {imagePath, gameSize, imageSize};
}

export abstract class GameSprite<T extends GameEntity<unknown, unknown>> {
  entity: T;
  sprite: Sprite;
  gameSize: {width: number; height: number};

  constructor(entity: T, scene: Scene) {
    this.entity = entity;
    const {imagePath, gameSize, imageSize} = getSizes(entity);
    this.gameSize = gameSize;
    const buildingManager = new SpriteManager(
      imagePath,
      imagePath,
      1,
      imageSize,
      scene,
    );
    this.sprite = new Sprite('Building', buildingManager);
    this.sprite.width = gameSize.width;
    this.sprite.height = gameSize.height;

    this.moveTo(this.entity.getMapPosition());
  }

  moveTo(mapPosition: MapPosition, reorient = false) {
    const position = tileToWorldPosition(mapPosition);
    position.x += tileSize.width / 2.0;
    position.y -= tileSize.height / 2.0;
    position.y += this.gameSize.height / 2.0 - tileSize.height / 2.0;

    const oldPosition = this.sprite.position;
    this.sprite.position = new Vector3(
      position.x,
      position.y,
      this.sprite.position.z,
    );

    if (reorient === true) {
      if (oldPosition.x < this.sprite.position.x) {
        this.sprite.invertU = false;
      } else if (oldPosition.x > this.sprite.position.x) {
        this.sprite.invertU = true;
      }
    }

    this.entity.setMapPosition(mapPosition);
  }

  destroy() {
    this.sprite.dispose();
  }
}
