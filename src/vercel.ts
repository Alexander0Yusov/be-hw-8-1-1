import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import express, { Request, Response } from 'express';
import { initAppModule } from './init-app-module';
import { appSetup } from './setup/app.setup';

const server = express();
let isInitialized = false;

export default async function handler(req: Request, res: Response) {
  if (!isInitialized) {
    const dynamicAppModule = await initAppModule();
    const app = await NestFactory.create(
      dynamicAppModule,
      new ExpressAdapter(server),
    );

    appSetup(app);
    await app.init();
    isInitialized = true;
  }

  return server(req, res);
}
