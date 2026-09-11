# Backend Architecture

## Framework
- **NestJS:** Chosen for its modular architecture and first-class TypeScript support.

## Module Structure
Each business domain resides in its own module:
- `auth/`
- `schools/`
- `users/`
- `academics/`
- ... (others)

## Layers
1. **Controllers:** Handle HTTP requests and input validation.
2. **Services:** Contain core business logic and coordinate between modules.
3. **Repositories/Prisma:** Interface with the database.
4. **DTOs:** Define data transfer contracts.
