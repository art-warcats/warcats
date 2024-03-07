import {Module} from '@nestjs/common';
import {ConfigModule} from '@nestjs/config';

import {StarrybotController} from '../../starrybot/controller/starrybot.controller';
import {WarCatsController} from '../../warcats/controller/warcats.controller';
import {WarCatsGateway} from '../../warcats/gateway/warcats.gateway';
import {makeRedisProvider} from '../../warcats/redis/warcats.redis';
import {MongooseModule} from '@nestjs/mongoose';
import {ThrottlerModule} from '@nestjs/throttler';
import {throwErr} from '../../helpers/throwErr';
import {gameSchema} from '../../warcats/schema/game.schema';
import {WarCatsGameService} from '../../warcats/service/warcats.game.service';
import {AppController} from '../controller/app.controller';
import {ScheduleModule} from '@nestjs/schedule';
import {gameMatchSchema} from '../../warcats/schema/game_match.schema';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    ThrottlerModule.forRoot({limit: 1000, ttl: 69}),
    MongooseModule.forRoot(
      process.env.MONGO_URL ?? throwErr('MONGO_URL not defined'),
    ),
    MongooseModule.forFeature([
      {
        name: 'Game',
        schema: gameSchema,
        collection: 'games',
      },
    ]),
    MongooseModule.forFeature([
      {
        name: 'GameMatch',
        schema: gameMatchSchema,
        collection: 'game_matches',
      },
    ]),
  ],
  controllers: [AppController, StarrybotController, WarCatsController],
  providers: [makeRedisProvider('REDIS'), WarCatsGameService, WarCatsGateway],
})
export class AppModule {}
