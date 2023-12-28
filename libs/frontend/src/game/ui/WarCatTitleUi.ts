import {GAME_HEIGHT, GAME_WIDTH} from '../../constants';
import {connectWallet, WalletInfo} from '../../hooks';
import {throwErr} from '../../utils';
import axios from 'axios';
import {Scalar, Scene, UniversalCamera, Vector3} from 'babylonjs';
import {
  AdvancedDynamicTexture,
  Button,
  Image,
  Rectangle,
  ScrollViewer,
  StackPanel,
} from 'babylonjs-gui';
import {WarCatGame} from '../WarCatGame';

const animationDuration = 2000;

const api = process.env.NEXT_PUBLIC_API;

export class WarCatTitleUi {
  static createInstance(scene: Scene) {
    new WarCatTitleUi(scene);
  }

  uiTexture: AdvancedDynamicTexture;
  selectedWarCat = 0;
  music: HTMLAudioElement;

  constructor(private readonly scene: Scene) {
    // scene.debugLayer.show();
    this.music = new Audio('music.mp3');
    this.music.loop = true;
    this.music.volume = 0.5;

    const camera = new UniversalCamera(
      'UniversalCamera',
      new Vector3(0, 0, -10),
      this.scene,
    );

    this.uiTexture = AdvancedDynamicTexture.CreateFullscreenUI('myUI', true);
    this.uiTexture.useSmallestIdeal = true;
    this.uiTexture.idealWidth = GAME_WIDTH;
    this.uiTexture.idealHeight = GAME_HEIGHT;

    const rect = new Rectangle('titleBackground');
    rect.width = 1;
    rect.height = 1;
    rect.background = 'black';
    this.uiTexture.addControl(rect);

    const titleImage = new Image('titleImage', 'images/title.png');
    const titleMul = 2;
    titleImage.widthInPixels = 450 * titleMul;
    titleImage.heightInPixels = 300 * titleMul;
    titleImage.topInPixels = -150;
    titleImage.stretch = Image.STRETCH_NONE;
    titleImage.alpha = 0;

    this.uiTexture.addControl(titleImage);

    const startTime = new Date();
    const visibleInterval = setInterval(() => {
      const timeDif = new Date().getTime() - startTime.getTime();
      const lerpDif = timeDif / animationDuration;
      const alpha = Math.min(1, Scalar.Lerp(0, 1, lerpDif));
      titleImage.alpha = alpha;
      if (alpha == 1) {
        clearInterval(visibleInterval);
        if (WalletInfo.getInstance() == null) {
          this.showWalletButton();
        } else {
          this.showPlayButton();
        }
      }
    }, 50);
  }

  destroy() {
    this.uiTexture.dispose();
    for (const node of this.scene.getNodes()) {
      node.dispose();
    }
  }

  private showWalletButton() {
    const walletButton = Button.CreateSimpleButton(
      'walletButton',
      'Connect Wallet',
    );
    walletButton.background = 'red';
    this.uiTexture.addControl(walletButton);
    walletButton.widthInPixels = 200;
    walletButton.heightInPixels = 60;
    walletButton.topInPixels = 150;
    walletButton.color = 'white';
    walletButton.textBlock!.fontFamily = 'ThaleahFat';

    walletButton.onPointerClickObservable.add(async () => {
      this.music.play();
      await connectWallet();
      walletButton.dispose();
      this.showPlayButton();
    });
  }

  private showPlayButton() {
    const playButton = Button.CreateSimpleButton('playButton', 'Play');
    playButton.background = 'red';
    this.uiTexture.addControl(playButton);
    playButton.widthInPixels = 200;
    playButton.heightInPixels = 60;
    playButton.topInPixels = 150;
    playButton.color = 'white';
    playButton.textBlock!.fontFamily = 'ThaleahFat';

    playButton.onPointerClickObservable.add(async () => {
      playButton.dispose();
      const warcatTokenId = (
        await axios.get(
          api + `/games/wallet/${WalletInfo.getInstance()!.wallet}`,
        )
      ).data;

      if (warcatTokenId != -1) {
        this.destroy();
        WarCatGame.createInstance(this.scene, warcatTokenId);
      } else {
        await this.showWarcats();
      }
    });
  }

  private async showWarcats() {
    let selectedWarCat = 0;
    const warCatHovers: Image[] = [];

    const spacerSize = 50;

    function setSelectedWarCat(index: number) {
      const {nfts} = WalletInfo.getInstance()!;

      if (index < nfts.length && index >= 0) {
        selectedWarCat = index;
        for (let i = 0; i < warCatHovers.length; i++) {
          if (selectedWarCat == i) {
            warCatHovers[i].zIndex = 0;
          } else {
            warCatHovers[i].zIndex = -2;
          }
        }
        // selectedWarCatImage.leftInPixels = spacerSize * (index + 1);
      }
    }

    const myScrollViewer = new ScrollViewer();
    myScrollViewer.widthInPixels = 800;
    myScrollViewer.heightInPixels = 250;
    myScrollViewer.background = 'black';
    myScrollViewer.topInPixels = 200;

    const innerStack = new StackPanel('inner stack');
    innerStack.isVertical = false;

    myScrollViewer.addControl(innerStack);

    this.uiTexture.addControl(myScrollViewer);

    const rect = new Rectangle('spacer');
    rect.widthInPixels = spacerSize;
    innerStack.addControl(rect);
    rect.color = 'black';
    // rect.zIndex = -2;

    let i = 0;
    rect.overlapGroup = 1;
    for (const nft of WalletInfo.getInstance()!.nfts) {
      const warcatTokenId = parseInt(
        (nft.name as string).replace('War Cat #', ''),
      );

      const warcatRect = new Rectangle('warcatrect' + warcatTokenId);
      warcatRect.widthInPixels = 200;
      warcatRect.heightInPixels = 200;

      const selectedWarCatImage = new Image(
        'selectedHover',
        '/pngs/circle.png',
      );
      warCatHovers.push(selectedWarCatImage);

      const warcatImage = Button.CreateImageOnlyButton(
        'warcat' + warcatTokenId,
        `assets/images/${warcatTokenId}.png`,
      );
      warcatRect.addControl(warcatImage);
      warcatRect.addControl(selectedWarCatImage);

      innerStack.addControl(warcatRect);
      const index = i;
      warcatImage.onPointerClickObservable.add(() => {
        console.log('did click', index);
        setSelectedWarCat(index);
      });
      warcatImage.overlapGroup = 1;
      // warcatImage.zIndex = -2;

      const rect = new Rectangle('spacer');
      rect.widthInPixels = 50;
      innerStack.addControl(rect);
      rect.color = 'black';
      // rect.zIndex = -2;
      rect.overlapGroup = 1;

      i++;
    }

    const playButton = Button.CreateSimpleButton('playButton', 'Select');
    playButton.background = 'red';
    this.uiTexture.addControl(playButton);
    playButton.widthInPixels = 200;
    playButton.heightInPixels = 60;
    playButton.topInPixels = 375;
    playButton.color = 'white';
    playButton.textBlock!.fontFamily = 'ThaleahFat';
    playButton.onPointerClickObservable.add(async () => {
      const nft = WalletInfo.getInstance()!.nfts[selectedWarCat];
      const warcatTokenId = parseInt(
        (nft.name as string).replace('War Cat #', ''),
      );
      this.destroy();
      WarCatGame.createInstance(this.scene, warcatTokenId);
    });
    //innerStack.addControl(outerRect);
    // outerRect.zIndex = -1;
    // outerRect.overlapGroup = 2;

    //myScrollViewer.addControl(outerRect);
    setSelectedWarCat(0);
  }
}
