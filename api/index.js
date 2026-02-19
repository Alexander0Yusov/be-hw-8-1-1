const { NestFactory } = require('@nestjs/core');
const { ExpressAdapter } = require('@nestjs/platform-express');
const express = require('express');

const { initAppModule } = require('../dist/init-app-module');
const { appSetup } = require('../dist/setup/app.setup');

// Создаем инстанс Express вне обработчика
const server = express();
// Переменная для хранения проинициализированного Nest-приложения
let cachedApp = null;

module.exports = async (req, res) => {
  // Если приложение еще не создано (Cold Start), создаем его
  if (!cachedApp) {
    const dynamicAppModule = await initAppModule();

    // Привязываем Nest к нашему внешнему инстансу express (server)
    cachedApp = await NestFactory.create(
      dynamicAppModule,
      new ExpressAdapter(server),
    );

    appSetup(cachedApp);

    // Инициализируем модули и связи (TypeORM и т.д.)
    await cachedApp.init();
  }

  // Передаем управление в Express
  // NestJS уже "сидит" внутри этого инстанса после cachedApp.init()
  return server(req, res);
};
