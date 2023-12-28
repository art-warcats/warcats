import { Controller, Get, Param } from '@nestjs/common';
import { getWarCatTokenIds } from 'warcats-common';
import { WarCatsGameService } from '../service/warcats.game.service';
//import { WarCatsService } from '../service/warcats.matching.service';

@Controller()
export class WarCatsController {
  constructor(private readonly warcatsGameService: WarCatsGameService) {}

  @Get('/games/wallet/:wallet')
  async game(@Param('wallet') wallet: string) {
    const game = await this.warcatsGameService.findActiveGame(wallet, null);
    if (game == null) {
      return -1;
    }

    const warcatTokenId =
      game.player1.wallet == wallet
        ? game.player1.warcatTokenId
        : game.player2.wallet == wallet
        ? game.player2.warcatTokenId
        : -1;
    const nfts: any[] = await getWarCatTokenIds(wallet);
    console.log('got nfts', wallet, nfts, warcatTokenId);
    if (!nfts.includes(`${warcatTokenId}`)) {
      return -1;
    }

    return warcatTokenId;
  }
}
