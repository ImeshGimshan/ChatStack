import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { ConnectionModule } from './connection/connection.module';
import { AuthMiddleware } from './auth/auth.middleware';
@Module({
  imports: [PrismaModule, ConnectionModule],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
      consumer
        .apply(AuthMiddleware)
        .forRoutes({path: '*', method: RequestMethod.ALL});
  }
}
