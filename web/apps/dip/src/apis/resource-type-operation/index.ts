import { post } from '@/utils/http';

const resourceTypeOperationUrl =
  '/api/authorization/v1/resource-type-operation';

export const getResourceTypeOperation = (resource_types: string[]) =>
  post(resourceTypeOperationUrl, { body: { method: 'GET', resource_types } });
