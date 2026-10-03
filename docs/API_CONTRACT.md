# CampusFlow API Contract & Error Conventions

This document establishes the standardized API request, response, and error handling contract across the entire CampusFlow platform for both Frontend and Backend engineers.

---

## 1. Response Envelope

Every API response from the CampusFlow backend returns a standard JSON envelope with a top-level boolean `success` flag.

### 1.1 Success Response

When an operation completes successfully:

```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {
    /* Payload object or array */
  }
}
```

- `success` (boolean): Always `true` for 2xx responses.
- `message` (string): Human-readable confirmation of the outcome.
- `data` (object | array | null): The payload containing the requested resource(s). For operations returning empty payloads (such as 204 or void actions), `data` is empty `{}` or `null`.

### 1.2 Error Response

When an error occurs (client-side or server-side):

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Please check the submitted fields",
    "details": [
      {
        "field": "email",
        "message": "Invalid email address format"
      }
    ]
  }
}
```

- `success` (boolean): Always `false` for 4xx and 5xx responses.
- `error.code` (string): Machine-readable uppercase snake_case identifier (e.g., `VALIDATION_ERROR`, `NOT_FOUND`, `UNAUTHORIZED`, `SERVICE_UNAVAILABLE`).
- `error.message` (string): Safe, user-friendly explanation of the error. Raw database error messages, stack traces, and internal secrets are NEVER exposed here.
- `error.details` (array): Optional array of specific field-level errors or diagnostic details.

---

## 2. HTTP Status Code Conventions

| Status Code | Meaning | Usage in CampusFlow |
|---|---|---|
| **200 OK** | Success | Standard read or update responses |
| **201 Created** | Created | Resource successfully created (POST) |
| **204 No Content** | No Content | Successful deletion or state change with no response body |
| **400 Bad Request** | Client Error | Malformed JSON, missing headers, or syntactically invalid input |
| **401 Unauthorized** | Unauthenticated | Missing or expired authentication token (Phase 01+) |
| **403 Forbidden** | Unauthorized | Authenticated user lacks permission to access the resource |
| **404 Not Found** | Resource Missing | Endpoint does not exist or target entity not found in database |
| **409 Conflict** | Conflict | Unique constraint violation (e.g., duplicate slug, existing registration) |
| **422 Unprocessable Entity** | Semantic Validation | Payload structurally valid but fails business rules or Zod schema |
| **429 Too Many Requests** | Rate Limited | Client exceeded request rate limit threshold |
| **500 Internal Server Error** | Server Error | Unhandled server error (sanitized message sent to client) |
| **503 Service Unavailable** | Dependency Down | Database or upstream service unreachable (e.g., readiness check fail) |

---

## 3. Standard Request Headers

- `Content-Type`: `application/json` (for POST, PUT, PATCH requests)
- `X-Request-Id`: Optional incoming correlation ID. If not supplied, the backend assigns a unique UUIDv4 and returns it in the response header `X-Request-Id`.
- `Origin`: Validated against configured `FRONTEND_URL` allowed origins.

---

## 4. Phase 00 Endpoints

### 4.1 Liveness Probe
- **Method**: `GET`
- **Path**: `/api/health`
- **Status**: `200 OK`
- **Response**:
```json
{
  "success": true,
  "message": "Service is healthy",
  "data": {
    "status": "UP",
    "service": "campusflow-backend",
    "timestamp": "2026-10-03T11:00:00.000Z"
  }
}
```

### 4.2 Readiness Probe
- **Method**: `GET`
- **Path**: `/api/health/ready`
- **Status**: `200 OK` (when database responds) or `503 Service Unavailable` (when database is down/disconnected)
- **Success (200)**:
```json
{
  "success": true,
  "message": "Service is ready",
  "data": {
    "status": "READY",
    "database": "CONNECTED",
    "timestamp": "2026-10-03T11:00:00.000Z"
  }
}
```
- **Failure (503)**:
```json
{
  "success": false,
  "error": {
    "code": "SERVICE_UNAVAILABLE",
    "message": "Database readiness check failed",
    "details": []
  }
}
```

### 4.3 API Information
- **Method**: `GET`
- **Path**: `/api`
- **Status**: `200 OK`
- **Response**:
```json
{
  "success": true,
  "message": "CampusFlow API is online",
  "data": {
    "name": "CampusFlow API",
    "version": "0.1.0",
    "phase": "00-foundation",
    "docs": "/api/docs"
  }
}
```

### 4.4 Swagger Documentation
- **Method**: `GET`
- **Path**: `/api/docs`
- **Interactive UI**: Swagger UI rendering the OpenAPI 3.0 specification.
