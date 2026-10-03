const bearer = [{ bearerAuth: [] }];

export const membershipOpenApiTags = [
  {
    name: 'Memberships',
    description: 'Membership lifecycle, applications, renewals, and administrative review',
  },
];

export const membershipOpenApiSchemas = {
  Membership: {
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid' },
      userId: { type: 'string', format: 'uuid' },
      planName: { type: 'string', enum: ['annual', 'semester', 'lifetime'], example: 'annual' },
      status: {
        type: 'string',
        enum: ['PENDING', 'ACTIVE', 'EXPIRED', 'SUSPENDED', 'REJECTED'],
        example: 'ACTIVE',
      },
      validUntil: { type: 'string', format: 'date-time', nullable: true },
      renewalCount: { type: 'integer', example: 0 },
      perks: {
        type: 'array',
        items: { type: 'string' },
        example: ['Free entry to general meetings', 'Discounted ticket rates'],
      },
      adminNotes: { type: 'string', nullable: true },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' },
    },
  },
  ApplyMembershipRequest: {
    type: 'object',
    required: ['planName'],
    properties: {
      planName: {
        type: 'string',
        enum: ['annual', 'semester', 'lifetime'],
        example: 'annual',
      },
      notes: {
        type: 'string',
        maxLength: 500,
        example: 'First-year computer science student.',
      },
    },
  },
  RenewMembershipRequest: {
    type: 'object',
    properties: {
      planName: {
        type: 'string',
        enum: ['annual', 'semester', 'lifetime'],
        example: 'annual',
      },
    },
  },
  UpdateMembershipStatusRequest: {
    type: 'object',
    required: ['status'],
    properties: {
      status: {
        type: 'string',
        enum: ['ACTIVE', 'EXPIRED', 'SUSPENDED', 'REJECTED'],
        example: 'ACTIVE',
      },
      adminNotes: {
        type: 'string',
        maxLength: 500,
        example: 'Payment verified and dues settled at campus desk.',
      },
    },
  },
};

export const membershipOpenApiPaths = {
  '/memberships': {
    post: {
      tags: ['Memberships'],
      summary: 'Apply for a membership',
      description: 'Authenticated user submits an application for organization membership.',
      security: bearer,
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ApplyMembershipRequest' },
          },
        },
      },
      responses: {
        '201': {
          description: 'Membership application submitted successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  message: { type: 'string' },
                  data: { $ref: '#/components/schemas/Membership' },
                },
              },
            },
          },
        },
        '400': { description: 'Validation error or duplicate active membership exists' },
        '401': { description: 'Unauthorized' },
      },
    },
    get: {
      tags: ['Memberships'],
      summary: 'List all memberships (Admin / Treasurer)',
      description: 'Authorized staff lists memberships with filtering and pagination.',
      security: bearer,
      parameters: [
        {
          name: 'status',
          in: 'query',
          schema: {
            type: 'string',
            enum: ['PENDING', 'ACTIVE', 'EXPIRED', 'SUSPENDED', 'REJECTED'],
          },
        },
        {
          name: 'planName',
          in: 'query',
          schema: { type: 'string', enum: ['annual', 'semester', 'lifetime'] },
        },
        {
          name: 'search',
          in: 'query',
          schema: { type: 'string' },
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
          description: 'Memberships retrieved successfully',
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
                      memberships: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/Membership' },
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
        '401': { description: 'Unauthorized' },
        '403': { description: 'Forbidden' },
      },
    },
  },
  '/memberships/apply': {
    post: {
      tags: ['Memberships'],
      summary: 'Apply for a membership (alias)',
      description: 'Alternative endpoint for submitting membership application.',
      security: bearer,
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ApplyMembershipRequest' },
          },
        },
      },
      responses: {
        '201': {
          description: 'Membership application submitted successfully',
        },
      },
    },
  },
  '/memberships/me': {
    get: {
      tags: ['Memberships'],
      summary: 'Get current user membership records',
      description:
        'Returns active and historical memberships belonging to the authenticated caller.',
      security: bearer,
      responses: {
        '200': {
          description: 'Retrieved user memberships successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  message: { type: 'string' },
                  data: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/Membership' },
                  },
                },
              },
            },
          },
        },
        '401': { description: 'Unauthorized' },
      },
    },
  },
  '/memberships/{membershipId}': {
    get: {
      tags: ['Memberships'],
      summary: 'Get membership by ID',
      description:
        'Returns details of a specific membership record. Permitted for record owner or authorized managers.',
      security: bearer,
      parameters: [
        {
          name: 'membershipId',
          in: 'path',
          required: true,
          schema: { type: 'string', format: 'uuid' },
        },
      ],
      responses: {
        '200': {
          description: 'Membership details retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  message: { type: 'string' },
                  data: { $ref: '#/components/schemas/Membership' },
                },
              },
            },
          },
        },
        '403': { description: 'Forbidden - not your membership' },
        '404': { description: 'Membership not found' },
      },
    },
  },
  '/memberships/{membershipId}/renew': {
    post: {
      tags: ['Memberships'],
      summary: 'Renew membership',
      description:
        'Renews an active, pending, or expired membership, extending the expiration window.',
      security: bearer,
      parameters: [
        {
          name: 'membershipId',
          in: 'path',
          required: true,
          schema: { type: 'string', format: 'uuid' },
        },
      ],
      requestBody: {
        required: false,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/RenewMembershipRequest' },
          },
        },
      },
      responses: {
        '200': {
          description: 'Membership renewed successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  message: { type: 'string' },
                  data: { $ref: '#/components/schemas/Membership' },
                },
              },
            },
          },
        },
        '400': { description: 'Membership cannot be renewed' },
        '403': { description: 'Forbidden' },
        '404': { description: 'Membership not found' },
      },
    },
  },
  '/memberships/{membershipId}/status': {
    patch: {
      tags: ['Memberships'],
      summary: 'Update membership status (Admin / Treasurer)',
      description: 'Transitions membership status following allowed state machine transitions.',
      security: bearer,
      parameters: [
        {
          name: 'membershipId',
          in: 'path',
          required: true,
          schema: { type: 'string', format: 'uuid' },
        },
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/UpdateMembershipStatusRequest' },
          },
        },
      },
      responses: {
        '200': {
          description: 'Membership status updated successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  message: { type: 'string' },
                  data: { $ref: '#/components/schemas/Membership' },
                },
              },
            },
          },
        },
        '400': { description: 'Invalid status transition' },
        '403': { description: 'Forbidden' },
        '404': { description: 'Membership not found' },
      },
    },
  },
};
