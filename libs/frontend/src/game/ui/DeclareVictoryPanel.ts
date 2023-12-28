import {WalletInfo} from '@warcats/frontend';
import {
  Button,
  Rectangle,
  ScrollViewer,
  StackPanel,
  TextBlock,
} from 'babylonjs-gui';
import {victoryTimeout} from '@warcats/common';
import {WarCatGame} from '../WarCatGame';

export class DeclareVictoryPanel extends Rectangle {
  updateInterval: NodeJS.Timer;
  constructor(private readonly warCatGame: WarCatGame) {
    super();

    const goldText = new TextBlock(
      'goldText',
      'Declare Victory if your opponent\nis taking a long time with their turn',
    );
    goldText.width = 4;
    goldText.height = 1;
    // goldText.fontSize = 16;
    goldText.color = 'black';
    goldText.fontFamily = 'ThaleahFat';
    goldText.topInPixels = -50;

    const getText = () => {
      const millisSinceMove =
        new Date().getTime() - this.warCatGame.game!.lastMoveTime;
      const millisRemaining = Math.max(0, victoryTimeout - millisSinceMove);
      const secondsRemaining = Math.floor(millisRemaining / 1000);
      console.log('last move', {
        victoryTimeout,
        millisSinceMove,
        millisRemaining,
        secondsRemaining,
      });
      return secondsRemaining;
    };

    const timerText = new TextBlock('timerText', getText() + 's');
    timerText.width = 4;
    timerText.height = 1;
    // goldText.fontSize = 16;
    timerText.color = 'black';
    timerText.fontFamily = 'ThaleahFat';
    timerText.topInPixels = 0;

    const victoryButton = Button.CreateSimpleButton('victoryButton', 'Victory');
    victoryButton.width = '100px';
    victoryButton.height = '40px';
    victoryButton.background = 'white';
    victoryButton.onPointerClickObservable.add(() =>
      this.warCatGame.declareVictory(),
    );
    victoryButton.textBlock!.fontFamily = 'ThaleahFat';
    victoryButton.topInPixels = 50;
    victoryButton.leftInPixels = -50;
    victoryButton.isEnabled = false;

    const button2 = Button.CreateSimpleButton('but2', 'Cancel');
    button2.width = '100px';
    button2.height = '40px';
    button2.background = 'white';
    button2.onPointerClickObservable.add(() =>
      this.warCatGame.hideDeclareVictoryPanel(),
    );
    button2.textBlock!.fontFamily = 'ThaleahFat';
    button2.topInPixels = 50;
    button2.leftInPixels = 50;

    this.addControl(goldText);
    this.addControl(timerText);
    this.addControl(victoryButton);
    this.addControl(button2);
    this.background = 'white';

    this.widthInPixels = 300;
    this.heightInPixels = 200;

    this.warCatGame.uiTexture.addControl(this);

    this.updateInterval = setInterval(() => {
      const secondsRemaining = getText();
      timerText.text = `${secondsRemaining}s`;
      victoryButton.isEnabled =
        secondsRemaining == 0 &&
        !this.warCatGame.game!.isWalletsTurn(WalletInfo.getInstance()!.wallet);
    }, 1000);
  }

  dispose() {
    clearInterval(this.updateInterval);
    super.dispose();
  }
}
