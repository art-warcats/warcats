import {Controller, Get, Post, Res, HttpStatus, Body} from '@nestjs/common';
import {Response} from 'express';
import {
  KeplrSignedDto,
  StarryBackendDto,
  TokenRuleInfo,
} from '../dto/starrybot.dto';

@Controller()
export class StarrybotController {
  @Post('/starry-backend')
  async starryBackend(
    @Body() dto: StarryBackendDto,
    @Res({passthrough: true}) res: Response,
  ) {
    const {
      logic,
      logger,
      // eslint-disable-next-line @typescript-eslint/no-var-requires
    } = require('../../../lib/starrybot/server');

    try {
      const results = await logic.hoistInquire(dto.traveller);
      res.status(HttpStatus.OK).send(results);

      return results;
    } catch (err) {
      logger.warn('Error hitting starry-backend', err);
      res
        .status(HttpStatus.BAD_REQUEST)
        .send({error: 'Error hitting back end'});
    }
  }

  @Post('/keplr-signed')
  async keplrSigned(
    @Body() dto: KeplrSignedDto,
    @Res({passthrough: true}) res: Response,
  ) {
    const {
      logic,
      logger,
      discord,
      // eslint-disable-next-line @typescript-eslint/no-var-requires
    } = require('../../../lib/starrybot/server');
    try {
      const results = await logic.hoistFinalize(dto, discord.client);
      res.status(!results || results.error ? 400 : 200).send(results);
    } catch (err) {
      logger.warn('Error hitting kelpr-signed', err);
      res.status(HttpStatus.BAD_REQUEST).send({error: 'error'});
    }
  }

  @Post('/token-rule-info')
  async tokenRuleInfo(
    @Body() dto: TokenRuleInfo,
    @Res({passthrough: true}) res: Response,
  ) {
    const {
      db,
      logic,
      logger,
      discord,
      // eslint-disable-next-line @typescript-eslint/no-var-requires
    } = require('../../../lib/starrybot/server');
    try {
      const results = await logic.tokenRuleInfo(dto, discord.client);
      res.status(!results || results.error ? 400 : 200).send(results);
    } catch (err) {
      logger.warn('Error hitting token-rule-info', err);
      res.status(400).send({
        error: {
          message: (err as any).message,
          code: (err as any).code,
        },
      });
    }
  }

  @Get('/health-check')
  getHello(@Res({passthrough: true}) res: Response) {
    res.status(200).send();
  }
}
