import {gameTiles, mapSize, tileSize} from '@warcats/common';

interface Props {
  x: number;
  y: number;
}

export const tileToWorldPosition = ({x, y}: Props) => {
  if (x < 0 || x >= gameTiles.width || y < 0 || y > gameTiles.height) {
    throw new Error('Invalid tile ' + x + ' ' + y);
  }

  const tileOffset = {
    x: x * tileSize.width,
    y: y * tileSize.height,
  };

  const worldPosition = {
    x: -mapSize.width / 2 + tileOffset.x,
    y: mapSize.height / 2 - tileOffset.y,
  };
  return worldPosition;
};
