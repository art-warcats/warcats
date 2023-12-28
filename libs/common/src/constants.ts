export const MAP_SPRITE_SIZE = {
  width: 4500,
  height: 3000,
};
export const gameTiles = {
  width: 15,
  height: 10,
};

export const gameSize = {
  width: 12.75,
  height: (12.75 * 2) / 3,
};

export const gamePadding = {
  top: 1,
  left: 1,
  bottom: 1,
  right: 1,
};

export const mapSize = {
  width: 12.75 - gamePadding.left - gamePadding.right,
  height: (12.75 * 2) / 3 - gamePadding.top - gamePadding.bottom,
};
export const tileSize = {
  width: mapSize.width / gameTiles.width,
  height: mapSize.height / gameTiles.height,
};

// eslint-disable-next-line @typescript-eslint/no-var-requires
export const PF = require('pathfinding');

export const victoryTimeout = 1000 * 60 * 2;
