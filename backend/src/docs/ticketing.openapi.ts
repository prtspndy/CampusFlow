const bearer = [{ bearerAuth: [] }];
const errorRef = {
  description: 'Error envelope',
  content: {
    'application/json': {
      schema: { $ref: '#/components/schemas/TicketingError' },
    },
  },
};

export const ticketingOpenApiTags = [
  {
    name: 'Registrations',
    description: 'Event registration for the authenticated user and staff rosters',
  },
  {
    name: 'Payments',
    description: 'Server-created Razorpay orders, signature verification, and webhooks',
  },
  {
    name: 'Tickets and check-in',
    description: 'QR ticket validation and door check-in',
  },
];

export const ticketingOpenApiSchemas = {
  TicketingError: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: false },
      error: {
        type: 'object',
        properties: {
          code: { type: 'string', example: 'CAPACITY_REACHED' },
          message: { type: 'string' },
          details: { type: 'array', items: { type: 'object' } },
        },
      },
    },
  },
  VerifyPaymentRequest: {
    type: 'object',
    required: ['razorpay_order_id', 'razorpay_payment_id', 'razorpay_signature'],
    properties: {
      razorpay_order_id: { type: 'string' },
      razorpay_payment_id: { type: 'string' },
      razorpay_signature: { type: 'string' },
    },
  },
  TicketTokenRequest: {
    type: 'object',
    required: ['token'],
    properties: {
      token: { type: 'string', example: 'cf_opaque_token' },
    },
  },
};

export const ticketingOpenApiPaths = {
  '/events/{eventId}/registrations': {
    post: {
      tags: ['Registrations'],
      summary: 'Register the authenticated user',
      security: bearer,
      parameters: [
        { name: 'eventId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
      ],
      responses: {
        '201': { description: 'Confirmed or reserved' },
        '400': errorRef,
        '401': errorRef,
        '404': errorRef,
        '409': errorRef,
      },
    },
    get: {
      tags: ['Registrations'],
      summary: 'List registrations for an event the caller manages',
      security: bearer,
      parameters: [
        { name: 'eventId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
      ],
      responses: { '200': { description: 'Paginated roster' }, '403': errorRef },
    },
  },
  '/registrations/me': {
    get: {
      tags: ['Registrations'],
      summary: 'List the caller registrations',
      security: bearer,
      responses: { '200': { description: 'Paginated registrations' }, '401': errorRef },
    },
  },
  '/registrations/{registrationId}/payment-order': {
    post: {
      tags: ['Payments'],
      summary: 'Create or reuse a Razorpay order',
      security: bearer,
      parameters: [
        {
          name: 'registrationId',
          in: 'path',
          required: true,
          schema: { type: 'string', format: 'uuid' },
        },
      ],
      responses: {
        '201': { description: 'Order created' },
        '200': { description: 'Existing open order' },
        '503': errorRef,
      },
    },
  },
  '/payments/verify': {
    post: {
      tags: ['Payments'],
      summary: 'Verify a Razorpay checkout signature and issue a ticket',
      security: bearer,
      requestBody: {
        required: true,
        content: {
          'application/json': { schema: { $ref: '#/components/schemas/VerifyPaymentRequest' } },
        },
      },
      responses: {
        '200': { description: 'Payment captured and ticket issued' },
        '400': errorRef,
        '409': errorRef,
      },
    },
  },
  '/payments/webhook': {
    post: {
      tags: ['Payments'],
      summary: 'Razorpay webhook. Requires the raw body and X-Razorpay-Signature.',
      parameters: [
        { name: 'X-Razorpay-Signature', in: 'header', required: true, schema: { type: 'string' } },
        { name: 'X-Razorpay-Event-Id', in: 'header', required: false, schema: { type: 'string' } },
      ],
      responses: { '200': { description: 'Processed, ignored, or duplicate' }, '400': errorRef },
    },
  },
  '/events/{eventId}/check-in': {
    post: {
      tags: ['Tickets and check-in'],
      summary: 'Check in a ticket token',
      security: bearer,
      parameters: [
        { name: 'eventId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': { schema: { $ref: '#/components/schemas/TicketTokenRequest' } },
        },
      },
      responses: {
        '200': { description: 'Checked in' },
        '403': errorRef,
        '404': errorRef,
        '409': errorRef,
      },
    },
  },
  '/events/{eventId}/tickets/validate': {
    post: {
      tags: ['Tickets and check-in'],
      summary: 'Validate a ticket without checking it in',
      security: bearer,
      parameters: [
        { name: 'eventId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': { schema: { $ref: '#/components/schemas/TicketTokenRequest' } },
        },
      },
      responses: { '200': { description: 'Validation result' }, '403': errorRef },
    },
  },
};
