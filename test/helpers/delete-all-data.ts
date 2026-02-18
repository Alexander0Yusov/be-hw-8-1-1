import { INestApplication } from '@nestjs/common';
import request from 'supertest';

export const deleteAllData = async (app: INestApplication): Promise<any> => {
  return request(app.getHttpServer()).delete(
    `/hometask_29/api/testing/all-data`,
  );
};
