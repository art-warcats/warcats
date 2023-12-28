import {gameSize, gameTiles, mapSize, tileSize} from '@warcats/common';

interface Props {
  x: number;
  y: number;
}

export const worldPositionToTile = ({x, y}: Props) => {
  const worldOffset = {
    x: x + mapSize.width / 2,
    y: mapSize.height / 2 - y,
  };

  const tile = {
    x: Math.floor(worldOffset.x / tileSize.width),
    y: Math.floor(worldOffset.y / tileSize.height),
  };

  console.log(tile);
  if (
    tile.x < 0 ||
    tile.x >= gameTiles.width ||
    tile.y < 0 ||
    tile.y >= gameTiles.height
  ) {
    throw new Error('Outside of this world');
  }

  return tile;
};
