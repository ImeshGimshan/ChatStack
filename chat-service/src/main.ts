import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(process.env.PORT ?? 3333);
  // Fix for BigInt serialization issue in spring boot
  (BigInt.prototype as any).toJSON = function () {
    return this.toString();
  };
}
bootstrap();
