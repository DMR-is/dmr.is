# NestJS Controller Skill

Complete guide for creating NestJS controllers with proper service, DTOs, validation, tests, and documentation following DMR.is conventions.

## Quick Start

Start with [skill.md](skill.md) for the main implementation guide with step-by-step instructions and checklist.

## Reference Documentation

Each reference file provides detailed examples and patterns:

### [dto-examples.md](dto-examples.md)
Complete DTO patterns including:
- Request DTOs with validation decorators
- Response DTOs with Swagger documentation
- Query DTOs with pagination and filtering
- Nested DTOs and arrays
- Common validation patterns (kennitala, phone, email)
- Enum and date filtering
- Boolean and numeric types

### [service-examples.md](service-examples.md)
Service implementation patterns including:
- Basic CRUD operations
- Logging best practices
- Error handling
- Relationships and joins
- Transactions
- Pagination with metadata
- Complex filtering
- Dependent service injection
- Soft delete patterns

### [controller-examples.md](controller-examples.md)
Controller patterns including:
- Basic CRUD controller
- Legal Gazette authorization patterns (admin, scope, mixed)
- File upload handling
- Custom decorators
- Batch operations
- Nested routes
- Export endpoints
- HTTP status codes reference
- Swagger documentation best practices

### [authorization-guide.md](authorization-guide.md)
Legal Gazette authorization documentation including:
- Authorization logic matrix
- Available decorators (`@AdminAccess()`, `@PublicWebScopes()`, etc.)
- Controller patterns (admin-only, scope-only, mixed access)
- Database lookup behavior
- Guard implementation details
- Testing with real Reflector
- Common pitfalls and best practices

### [testing-examples.md](testing-examples.md)
Test patterns including:
- Service tests with mocked Sequelize models
- Controller tests with mocked services
- Authorization guard tests using real Reflector
- Test user factories
- Integration tests
- Running tests efficiently
- Best practices and important notes

## File Structure

When implementing a new controller, you'll create:

```
modules/{resource}/
├── dto/
│   ├── create-{resource}.dto.ts
│   ├── update-{resource}.dto.ts
│   ├── get-{resource}-query.dto.ts
│   ├── {resource}-response.dto.ts
│   └── index.ts
├── models/
│   └── {resource}.model.ts
├── {resource}.controller.ts
├── {resource}.controller.module.ts
├── {resource}.controller.spec.ts
├── {resource}.provider.module.ts
├── {resource}.service.ts
├── {resource}.service.interface.ts
└── {resource}.service.spec.ts
```

## Usage Flow

1. **Read [skill.md](skill.md)** - Main implementation guide
2. **Reference specific docs as needed:**
   - Creating DTOs? → [dto-examples.md](dto-examples.md)
   - Implementing service? → [service-examples.md](service-examples.md)
   - Building controller? → [controller-examples.md](controller-examples.md)
   - Need authorization? → [authorization-guide.md](authorization-guide.md)
   - Writing tests? → [testing-examples.md](testing-examples.md)
3. **Follow the checklist** in skill.md to ensure completeness

## Key Conventions

- Use `@dmr.is/logging` for NestJS services (Node.js runtime)
- Follow two-module pattern (provider + controller)
- Use dependency injection with interface symbols
- Include `@LogMethod()` on all controller methods
- Always use proper HTTP status codes
- Document all endpoints with Swagger decorators
- Write tests for both success and error cases
- Use real Reflector in authorization tests

## Common Tasks

### Adding a new CRUD endpoint
1. Start with [skill.md](skill.md) step-by-step guide
2. Reference [dto-examples.md](dto-examples.md) for DTO patterns
3. Reference [service-examples.md](service-examples.md) for service implementation
4. Reference [controller-examples.md](controller-examples.md) for controller code

### Implementing authorization
1. Read [authorization-guide.md](authorization-guide.md) for patterns
2. Choose appropriate decorators (`@AdminAccess()`, scopes, or mixed)
3. Reference [testing-examples.md](testing-examples.md) for authorization tests

### Adding tests
1. Read [testing-examples.md](testing-examples.md)
2. Follow service test patterns for business logic
3. Follow controller test patterns for endpoint logic
4. Follow authorization test patterns if using guards

## Documentation Links

- [DMR.is CLAUDE.md](../../.claude/CLAUDE.md) - Project-wide conventions
- [NestJS Documentation](https://docs.nestjs.com)
- [Sequelize Documentation](https://sequelize.org)
- [Class Validator](https://github.com/typestack/class-validator)
- [Swagger/OpenAPI](https://swagger.io/specification/)

## Support

For questions or improvements to this skill, consult the DMR.is development team or update these reference files.
