import { INestApplication } from '@nestjs/common';
import { GLOBAL_PREFIX } from 'src/setup/global-prefix.setup';
import request from 'supertest';

export const deleteAllData = async (app: INestApplication): Promise<any> => {
  return request(app.getHttpServer()).delete(
    `/${GLOBAL_PREFIX}/testing/all-data`,
  );
};
