import {Button, StackPanel} from 'babylonjs-gui';
import {WarCatGame} from '../WarCatGame';

export class OptionsPanel extends StackPanel {
  constructor(private readonly warCatGame: WarCatGame) {
    super();
    this.warCatGame.uiTexture.addControl(this);

    const declareVictoryButton = Button.CreateSimpleButton(
      'declareVictory',
      'Declare Victory',
    );
    declareVictoryButton.width = '100px';
    declareVictoryButton.height = '40px';
    declareVictoryButton.background = 'green';
    declareVictoryButton.onPointerClickObservable.add(() =>
      this.warCatGame.showDeclareVictory(),
    );
    declareVictoryButton.background = 'white';
    declareVictoryButton.textBlock!.fontFamily = 'ThaleahFat';

    const muteButton = Button.CreateSimpleButton('mute', 'Mute');
    muteButton.width = '100px';
    muteButton.height = '40px';
    muteButton.background = 'green';
    muteButton.background = 'white';
    muteButton.textBlock!.fontFamily = 'ThaleahFat';

    this.addControl(declareVictoryButton);
    this.addControl(muteButton);
    this.leftInPixels = -400;
    this.topInPixels = 300;
  }
}
