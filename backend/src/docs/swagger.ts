import { authOpenApiPaths, authOpenApiSchemas, authOpenApiTags } from './auth.openapi.js';
import {
  membershipOpenApiPaths,
  membershipOpenApiSchemas,
  membershipOpenApiTags,
} from './membership.openapi.js';
import { eventOpenApiPaths, eventOpenApiSchemas, eventOpenApiTags } from './event.openapi.js';

export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'CampusFlow API',
    version: '0.2.0',
    description:
      'Student Organization Management System API — Phase 00 foundation, Phase 01 authentication, and Phase 02 membership & events management.',
    contact: {
      name: 'CampusFlow Engineering Team',
    },
  },
  servers: [
    {
      url: '/api',
      description: 'CampusFlow API Base Endpoint',
    },
  ],
  tags: [
    {
      name: 'System & Observability',
      description: 'Health, readiness probes and API metadata endpoints',
    },
    ...authOpenApiTags,
    ...membershipOpenApiTags,
    ...eventOpenApiTags,
  ],
  paths: {
    '/': {
      get: {
        tags: ['System & Observability'],
        summary: 'API Service Information',
        description:
          'Returns current API service version, current phase status, and documentation references.',
        responses: {
          '200': {
            description: 'API information retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ApiInfoResponse',
                },
              },
            },
          },
        },
      },
    },
    '/health': {
      get: {
        tags: ['System & Observability'],
        summary: 'Liveness Probe',
        description:
          'Verifies that the Express application process is running and accepting incoming network requests.',
        responses: {
          '200': {
            description: 'Express service is healthy and operating normally',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/LivenessResponse',
                },
              },
            },
          },
        },
      },
    },
    '/health/ready': {
      get: {
        tags: ['System & Observability'],
        summary: 'Readiness Probe',
        description:
          'Executes an active probe query (`SELECT 1`) against the Neon PostgreSQL database via Prisma ORM.',
        responses: {
          '200': {
            description: 'Database is reachable, connected, and ready for queries',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ReadinessResponse',
                },
              },
            },
          },
          '503': {
            description: 'Database is unavailable, unreachable, or unconfigured',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ServiceUnavailableResponse',
                },
              },
            },
          },
        },
      },
    },
    ...authOpenApiPaths,
    ...membershipOpenApiPaths,
    ...eventOpenApiPaths,
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      ...authOpenApiSchemas,
      ...membershipOpenApiSchemas,
      ...eventOpenApiSchemas,
      ApiInfoResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'CampusFlow API is online' },
          data: {
            type: 'object',
            properties: {
              name: { type: 'string', example: 'CampusFlow API' },
              version: { type: 'string', example: '0.1.0' },
              phase: { type: 'string', example: '00-foundation' },
              docs: { type: 'string', example: '/api/docs' },
            },
          },
        },
      },
      LivenessResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Service is healthy' },
          data: {
            type: 'object',
            properties: {
              status: { type: 'string', example: 'UP' },
              service: { type: 'string', example: 'campusflow-backend' },
              timestamp: {
                type: 'string',
                format: 'date-time',
                example: '2026-10-03T11:00:00.000Z',
              },
            },
          },
        },
      },
      ReadinessResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Service is ready' },
          data: {
            type: 'object',
            properties: {
              status: { type: 'string', example: 'READY' },
              database: { type: 'string', example: 'CONNECTED' },
              timestamp: {
                type: 'string',
                format: 'date-time',
                example: '2026-10-03T11:00:00.000Z',
              },
            },
          },
        },
      },
      ServiceUnavailableResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: {
            type: 'object',
            properties: {
              code: { type: 'string', example: 'SERVICE_UNAVAILABLE' },
              message: { type: 'string', example: 'Database readiness check failed' },
              details: { type: 'array', items: { type: 'string' }, example: [] },
            },
          },
        },
      },
      NotFoundResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: {
            type: 'object',
            properties: {
              code: { type: 'string', example: 'NOT_FOUND' },
              message: { type: 'string', example: 'Cannot GET /api/unknown' },
              details: { type: 'array', items: { type: 'string' }, example: [] },
            },
          },
        },
      },
    },
  },
};
