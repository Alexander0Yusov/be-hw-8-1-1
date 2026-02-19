const { NestFactory } = require('@nestjs/core');
const { ExpressAdapter } = require('@nestjs/platform-express');
const express = require('express');

// Импортируем твои настройки из скомпилированного билда
const { initAppModule } = require('../dist/init-app-module');
const { appSetup } = require('../dist/setup/app.setup');

const server = express();

export default async (req, res) => {
  const dynamicAppModule = await initAppModule();
  const app = await NestFactory.create(
    dynamicAppModule,
    new ExpressAdapter(server),
  );

  appSetup(app);
  await app.init(); // Инициализация без listen(port)

  server(req, res);
};
