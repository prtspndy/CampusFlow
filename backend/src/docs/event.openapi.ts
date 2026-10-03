const bearer = [{ bearerAuth: [] }];

export const eventOpenApiTags = [
  {
    name: 'Events',
    description: 'Campus organization event lifecycle, scheduling, discovery, and management',
  },
];

export const eventOpenApiSchemas = {
  Event: {
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid' },
      title: { type: 'string', example: 'Spring Hackathon 2026' },
      description: { type: 'string', example: 'Annual 24-hour campus hackathon.' },
      category: { type: 'string', example: 'Technology' },
      venue: { type: 'string', example: 'Student Union Grand Hall' },
      startsAt: { type: 'string', format: 'date-time' },
      endsAt: { type: 'string', format: 'date-time' },
      capacity: { type: 'integer', example: 100 },
      price: { type: 'number', example: 0 },
      status: {
        type: 'string',
        enum: ['DRAFT', 'PUBLISHED', 'CANCELLED', 'COMPLETED'],
        example: 'PUBLISHED',
      },
      organizerId: { type: 'string', format: 'uuid' },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' },
    },
  },
  CreateEventRequest: {
    type: 'object',
    required: ['title', 'description', 'category', 'venue', 'startsAt', 'endsAt', 'capacity'],
    properties: {
      title: { type: 'string', minLength: 3, maxLength: 120, example: 'Spring Hackathon 2026' },
      description: {
        type: 'string',
        minLength: 10,
        maxLength: 2000,
        example: 'Annual 24-hour campus hackathon.',
      },
      category: { type: 'string', minLength: 2, maxLength: 50, example: 'Technology' },
      venue: { type: 'string', minLength: 2, maxLength: 100, example: 'Student Union Grand Hall' },
      startsAt: { type: 'string', format: 'date-time', example: '2026-11-01T10:00:00.000Z' },
      endsAt: { type: 'string', format: 'date-time', example: '2026-11-02T10:00:00.000Z' },
      capacity: { type: 'integer', minimum: 1, maximum: 10000, example: 100 },
      price: { type: 'number', minimum: 0, default: 0, example: 0 },
      status: { type: 'string', enum: ['DRAFT', 'PUBLISHED'], default: 'DRAFT' },
    },
  },
  UpdateEventRequest: {
    type: 'object',
    properties: {
      title: { type: 'string', minLength: 3, maxLength: 120 },
      description: { type: 'string', minLength: 10, maxLength: 2000 },
      category: { type: 'string', minLength: 2, maxLength: 50 },
      venue: { type: 'string', minLength: 2, maxLength: 100 },
      startsAt: { type: 'string', format: 'date-time' },
      endsAt: { type: 'string', format: 'date-time' },
      capacity: { type: 'integer', minimum: 1, maximum: 10000 },
      price: { type: 'number', minimum: 0 },
    },
  },
};

export const eventOpenApiPaths = {
  '/events': {
    post: {
      tags: ['Events'],
      summary: 'Create an event',
      description: 'Authorized organizer creates a new draft or published event.',
      security: bearer,
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/CreateEventRequest' },
          },
        },
      },
      responses: {
        '201': {
          description: 'Event created successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  message: { type: 'string' },
                  data: { $ref: '#/components/schemas/Event' },
                },
              },
            },
          },
        },
        '400': { description: 'Validation error (e.g., endsAt before startsAt)' },
        '401': { description: 'Unauthorized' },
        '403': { description: 'Forbidden - requires events:create permission' },
      },
    },
    get: {
      tags: ['Events'],
      summary: 'List events',
      description:
        'Retrieve events. Public users see PUBLISHED events. Authorized staff see drafts.',
      parameters: [
        {
          name: 'status',
          in: 'query',
          schema: { type: 'string', enum: ['DRAFT', 'PUBLISHED', 'CANCELLED', 'COMPLETED'] },
        },
        {
          name: 'category',
          in: 'query',
          schema: { type: 'string' },
        },
        {
          name: 'search',
          in: 'query',
          schema: { type: 'string' },
        },
        {
          name: 'from',
          in: 'query',
          schema: { type: 'string', format: 'date-time' },
        },
        {
          name: 'to',
          in: 'query',
          schema: { type: 'string', format: 'date-time' },
        },
        {
          name: 'page',
          in: 'query',
          schema: { type: 'integer', default: 1 },
        },
        {
          name: 'limit',
          in: 'query',
          schema: { type: 'integer', default: 20 },
        },
      ],
      responses: {
        '200': {
          description: 'Events retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  message: { type: 'string' },
                  data: {
                    type: 'object',
                    properties: {
                      events: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/Event' },
                      },
                      pagination: {
                        type: 'object',
                        properties: {
                          total: { type: 'integer' },
                          page: { type: 'integer' },
                          limit: { type: 'integer' },
                          totalPages: { type: 'integer' },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  '/events/{eventId}': {
    get: {
      tags: ['Events'],
      summary: 'Get event by ID',
      description:
        'Retrieve single event details. Drafts and cancelled events require organizer ownership or staff permissions.',
      parameters: [
        {
          name: 'eventId',
          in: 'path',
          required: true,
          schema: { type: 'string', format: 'uuid' },
        },
      ],
      responses: {
        '200': {
          description: 'Event retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  message: { type: 'string' },
                  data: { $ref: '#/components/schemas/Event' },
                },
              },
            },
          },
        },
        '403': { description: 'Forbidden - cannot view unpublished event' },
        '404': { description: 'Event not found' },
      },
    },
    patch: {
      tags: ['Events'],
      summary: 'Update event',
      description: 'Update event details. Allowed for event organizer or admin/treasurer.',
      security: bearer,
      parameters: [
        {
          name: 'eventId',
          in: 'path',
          required: true,
          schema: { type: 'string', format: 'uuid' },
        },
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/UpdateEventRequest' },
          },
        },
      },
      responses: {
        '200': {
          description: 'Event updated successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  message: { type: 'string' },
                  data: { $ref: '#/components/schemas/Event' },
                },
              },
            },
          },
        },
        '400': { description: 'Validation error' },
        '403': { description: 'Forbidden - not the event organizer' },
        '404': { description: 'Event not found' },
      },
    },
  },
  '/events/{eventId}/publish': {
    post: {
      tags: ['Events'],
      summary: 'Publish event',
      description: 'Transitions event status from DRAFT to PUBLISHED.',
      security: bearer,
      parameters: [
        {
          name: 'eventId',
          in: 'path',
          required: true,
          schema: { type: 'string', format: 'uuid' },
        },
      ],
      responses: {
        '200': {
          description: 'Event published successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  message: { type: 'string' },
                  data: { $ref: '#/components/schemas/Event' },
                },
              },
            },
          },
        },
        '400': { description: 'Event is already published or completed' },
        '403': { description: 'Forbidden' },
        '404': { description: 'Event not found' },
      },
    },
  },
  '/events/{eventId}/cancel': {
    post: {
      tags: ['Events'],
      summary: 'Cancel event',
      description: 'Transitions event status to CANCELLED.',
      security: bearer,
      parameters: [
        {
          name: 'eventId',
          in: 'path',
          required: true,
          schema: { type: 'string', format: 'uuid' },
        },
      ],
      responses: {
        '200': {
          description: 'Event cancelled successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  message: { type: 'string' },
                  data: { $ref: '#/components/schemas/Event' },
                },
              },
            },
          },
        },
        '400': { description: 'Event is already completed' },
        '403': { description: 'Forbidden' },
        '404': { description: 'Event not found' },
      },
    },
  },
};
