const errorSchema = {
  type: 'object',
  properties: {
    success: { type: 'boolean', example: false },
    error: {
      type: 'object',
      properties: {
        code: { type: 'string' },
        message: { type: 'string' },
        details: { type: 'array', items: { type: 'object' } },
      },
    },
  },
};

const publicUserSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    email: { type: 'string', format: 'email' },
    name: { type: 'string' },
    role: {
      type: 'string',
      enum: ['ADMIN', 'MEMBER', 'EVENT_MANAGER', 'TREASURER'],
    },
    roleDisplayName: { type: 'string', example: 'Club Member / Student' },
    permissions: {
      type: 'array',
      items: { type: 'string' },
    },
    status: { type: 'string', enum: ['active', 'disabled'] },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
  },
};

const sessionSchema = {
  type: 'object',
  properties: {
    token: {
      type: 'string',
      description: 'Short-lived JWT access token. Send as Authorization: Bearer.',
    },
    refreshToken: {
      type: 'string',
      description:
        'Opaque refresh token. Store it securely and send it only to POST /auth/refresh.',
    },
    expiresIn: { type: 'integer', description: 'Access token lifetime in seconds.', example: 900 },
    user: publicUserSchema,
  },
};

const bearer = [{ bearerAuth: [] }];

export const authOpenApiTags = [
  {
    name: 'Authentication',
    description: 'Registration, sign-in, refresh, sign-out, and the current user profile',
  },
  {
    name: 'Users',
    description:
      'Authenticated profile access. Users can read only their own profile unless they are admins.',
  },
  {
    name: 'Admin',
    description: 'Administrative user directory. Requires the admin role.',
  },
];

export const authOpenApiPaths = {
  '/auth/register': {
    post: {
      tags: ['Authentication'],
      summary: 'Register a member account',
      description:
        'Open self-registration creates a member account. Role, status, and passwordHash cannot be submitted. Email is trimmed and lowercased.',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/RegisterRequest' },
          },
        },
      },
      responses: {
        '201': {
          description: 'Account created',
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/PublicUserResponse' } },
          },
        },
        '409': {
          description: 'Email already registered',
          content: { 'application/json': { schema: errorSchema } },
        },
        '422': {
          description: 'Validation failed',
          content: { 'application/json': { schema: errorSchema } },
        },
        '429': {
          description: 'Rate limited',
          content: { 'application/json': { schema: errorSchema } },
        },
      },
    },
  },
  '/auth/login': {
    post: {
      tags: ['Authentication'],
      summary: 'Sign in',
      description:
        'Returns a 15-minute access token and a rotating refresh token. Unknown emails, wrong passwords, and disabled accounts share one error. A supplied role is ignored.',
      requestBody: {
        required: true,
        content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginRequest' } } },
      },
      responses: {
        '200': {
          description: 'Signed in',
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/SessionResponse' } },
          },
        },
        '401': {
          description: 'Unknown user, wrong password, or disabled account',
          content: { 'application/json': { schema: errorSchema } },
        },
        '422': {
          description: 'Validation failed',
          content: { 'application/json': { schema: errorSchema } },
        },
        '429': {
          description: 'Rate limited',
          content: { 'application/json': { schema: errorSchema } },
        },
      },
    },
  },
  '/auth/refresh': {
    post: {
      tags: ['Authentication'],
      summary: 'Rotate a refresh token',
      description:
        'Atomically consumes the presented refresh token only when it is unrevoked, then stores its replacement. The new tokens are returned only after commit. A concurrent loser does not revoke that replacement. Presenting an already consumed token revokes the rest of that token family. Disabled accounts receive the same invalid-token error.',
      requestBody: {
        required: true,
        content: {
          'application/json': { schema: { $ref: '#/components/schemas/RefreshRequest' } },
        },
      },
      responses: {
        '200': {
          description: 'Session refreshed',
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/SessionResponse' } },
          },
        },
        '401': {
          description: 'Invalid, expired, reused, or disabled-account refresh token',
          content: { 'application/json': { schema: errorSchema } },
        },
        '500': {
          description: 'Rotation did not commit. The presented refresh token remains valid.',
          content: { 'application/json': { schema: errorSchema } },
        },
        '422': {
          description: 'Validation failed',
          content: { 'application/json': { schema: errorSchema } },
        },
        '429': {
          description: 'Rate limited',
          content: { 'application/json': { schema: errorSchema } },
        },
      },
    },
  },
  '/auth/logout': {
    post: {
      tags: ['Authentication'],
      summary: 'Sign out',
      security: bearer,
      description:
        'In one transaction, increments the user token version and revokes every active refresh token for that user. Already issued access tokens fail on the next request only after that transaction commits. This signs out every device for the account.',
      responses: {
        '200': {
          description: 'Signed out',
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/LogoutResponse' } },
          },
        },
        '401': {
          description: 'Missing, invalid, expired, or revoked access token',
          content: { 'application/json': { schema: errorSchema } },
        },
        '500': {
          description: 'Logout did not commit. Existing tokens remain valid.',
          content: { 'application/json': { schema: errorSchema } },
        },
      },
    },
  },
  '/auth/me': {
    get: {
      tags: ['Authentication'],
      summary: 'Current user',
      security: bearer,
      responses: {
        '200': {
          description: 'Current profile',
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/PublicUserResponse' } },
          },
        },
        '401': {
          description: 'Unauthenticated',
          content: { 'application/json': { schema: errorSchema } },
        },
      },
    },
    patch: {
      tags: ['Authentication'],
      summary: 'Update current user name',
      security: bearer,
      description: 'Only name can be changed. Role, status, email, and passwordHash are rejected.',
      requestBody: {
        required: true,
        content: {
          'application/json': { schema: { $ref: '#/components/schemas/UpdateProfileRequest' } },
        },
      },
      responses: {
        '200': {
          description: 'Profile updated',
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/PublicUserResponse' } },
          },
        },
        '401': {
          description: 'Unauthenticated',
          content: { 'application/json': { schema: errorSchema } },
        },
        '422': {
          description: 'Validation failed',
          content: { 'application/json': { schema: errorSchema } },
        },
      },
    },
  },
  '/users/{userId}': {
    get: {
      tags: ['Users'],
      summary: 'Read a user profile',
      security: bearer,
      description: 'Members can read only their own id. Admins can read any user.',
      parameters: [
        { name: 'userId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
      ],
      responses: {
        '200': {
          description: 'Profile',
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/PublicUserResponse' } },
          },
        },
        '401': {
          description: 'Unauthenticated',
          content: { 'application/json': { schema: errorSchema } },
        },
        '403': {
          description: 'Another user profile',
          content: { 'application/json': { schema: errorSchema } },
        },
        '404': {
          description: 'User not found',
          content: { 'application/json': { schema: errorSchema } },
        },
        '422': {
          description: 'Invalid user id',
          content: { 'application/json': { schema: errorSchema } },
        },
      },
    },
  },
  '/admin/users': {
    get: {
      tags: ['Admin'],
      summary: 'List users',
      security: bearer,
      description: 'Admin only. Returns safe profile fields for up to 100 users.',
      responses: {
        '200': {
          description: 'User list',
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/UserListResponse' } },
          },
        },
        '401': {
          description: 'Unauthenticated',
          content: { 'application/json': { schema: errorSchema } },
        },
        '403': {
          description: 'Not an admin',
          content: { 'application/json': { schema: errorSchema } },
        },
      },
    },
  },
  '/admin/users/{userId}/role': {
    patch: {
      tags: ['Admin'],
      summary: 'Assign user role',
      security: bearer,
      description:
        'Admin only (requires users.assign_roles permission). Assigns one of the canonical four roles to a user and revokes their active sessions. Cannot demote the last active admin.',
      parameters: [
        {
          name: 'userId',
          in: 'path',
          required: true,
          schema: { type: 'string', format: 'uuid' },
        },
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/AssignRoleRequest' },
          },
        },
      },
      responses: {
        '200': {
          description: 'Role updated successfully',
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/PublicUserResponse' } },
          },
        },
        '400': {
          description: 'Cannot demote last active admin',
          content: { 'application/json': { schema: errorSchema } },
        },
        '401': {
          description: 'Unauthenticated',
          content: { 'application/json': { schema: errorSchema } },
        },
        '403': {
          description: 'Forbidden / Missing permission',
          content: { 'application/json': { schema: errorSchema } },
        },
        '404': {
          description: 'User not found',
          content: { 'application/json': { schema: errorSchema } },
        },
        '422': {
          description: 'Validation failed',
          content: { 'application/json': { schema: errorSchema } },
        },
      },
    },
  },
};

export const authOpenApiSchemas = {
  AssignRoleRequest: {
    type: 'object',
    required: ['role'],
    additionalProperties: false,
    properties: {
      role: {
        type: 'string',
        enum: ['ADMIN', 'MEMBER', 'EVENT_MANAGER', 'TREASURER'],
      },
    },
  },
  RegisterRequest: {
    type: 'object',
    required: ['name', 'email', 'password'],
    additionalProperties: false,
    properties: {
      name: { type: 'string', minLength: 1, maxLength: 80 },
      email: { type: 'string', format: 'email' },
      password: { type: 'string', minLength: 8, maxLength: 72 },
    },
  },
  LoginRequest: {
    type: 'object',
    required: ['email', 'password'],
    properties: {
      email: { type: 'string', format: 'email' },
      password: { type: 'string' },
    },
  },
  RefreshRequest: {
    type: 'object',
    required: ['refreshToken'],
    additionalProperties: false,
    properties: { refreshToken: { type: 'string' } },
  },
  UpdateProfileRequest: {
    type: 'object',
    required: ['name'],
    additionalProperties: false,
    properties: { name: { type: 'string', minLength: 1, maxLength: 80 } },
  },
  PublicUserResponse: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: true },
      message: { type: 'string' },
      data: publicUserSchema,
    },
  },
  SessionResponse: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: true },
      message: { type: 'string' },
      data: sessionSchema,
    },
  },
  LogoutResponse: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: true },
      message: { type: 'string', example: 'Signed out successfully' },
      data: { nullable: true, example: null },
    },
  },
  UserListResponse: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: true },
      message: { type: 'string' },
      data: {
        type: 'object',
        properties: { users: { type: 'array', items: publicUserSchema } },
      },
    },
  },
};
