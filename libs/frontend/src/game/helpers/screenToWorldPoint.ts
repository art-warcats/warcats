import {Scene} from 'babylonjs';
import {GAME_WIDTH, GAME_HEIGHT} from '../../constants';
import {gameSize, mapSize} from '@warcats/common';

export const screenToWorldPoint = (scene: Scene, evt: any) => {
  const engineWidth = scene.getEngine().getRenderWidth();
  const engineHeight = scene.getEngine().getRenderHeight();

  const expectedWidth = (engineHeight * GAME_WIDTH) / GAME_HEIGHT;
  const expectedHeight = (engineWidth * GAME_HEIGHT) / GAME_WIDTH;

  let width = engineWidth;
  let height = engineHeight;
  if (engineWidth > expectedWidth) {
    width = expectedWidth;
  } else {
    height = expectedHeight;
  }

  const offsetX =
    width == engineWidth
      ? evt.offsetX
      : evt.offsetX - (engineWidth - width) / 2.0;
  const offsetY =
    height == engineHeight
      ? evt.offsetY
      : evt.offsetY - (engineHeight - height) / 2.0;

  console.log({width, height, engineWidth, engineHeight});
  const propX = offsetX / width;
  const propY = offsetY / height;
  const worldPoint = {
    x: propX * gameSize.width - gameSize.width / 2.0,
    y: gameSize.height / 2.0 - propY * gameSize.height,
  };
  return worldPoint;
};
