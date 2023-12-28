import {Scene, SpriteManager, Sprite, Color4, Vector3} from 'babylonjs';
import {MapPosition, tileSize} from '@warcats/common';
import {tileToWorldPosition} from '../helpers';

export enum HighlightSpriteColor {
  Grey = 'grey',
  Red = 'red',
  White = 'white',
  DarkRed = 'darkred',
}

const getColor4 = (color: HighlightSpriteColor) => {
  switch (color) {
    case HighlightSpriteColor.Grey:
      return new Color4(0.75, 0.75, 0.75, 0.25);
    case HighlightSpriteColor.Red:
      return new Color4(1, 0, 0, 1);
    case HighlightSpriteColor.White:
      return new Color4(1, 1, 1, 0.75);
    case HighlightSpriteColor.DarkRed:
      return new Color4(1, 0, 0, 0.25);
    default:
      throw new Error('bad highlight sprite color');
  }
};

export class HighlightSprite {
  sprite: Sprite;
  constructor(
    position: MapPosition,
    color: HighlightSpriteColor,
    scene: Scene,
  ) {
    const managerMap = new SpriteManager(
      'circle',
      '/pngs/circle.png',
      1,
      {width: 980, height: 980},
      scene,
    ); //scene is optional and defaults to the current scene
    const map = new Sprite('walkHighlight', managerMap);
    map.width = tileSize.width;
    map.height = tileSize.height;
    map.color = getColor4(color);
    const worldPoint = tileToWorldPosition(position);

    const pos = {
      x: worldPoint.x + tileSize.width / 2.0,
      y: worldPoint.y - tileSize.height / 2.0,
    };
    map.position = new Vector3(pos.x, pos.y, 0);
    this.sprite = map;
  }

  dispose() {
    return this.sprite.dispose();
  }
}
