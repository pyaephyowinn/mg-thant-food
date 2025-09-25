# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a full-stack web application built with:
- **Frontend**: Next.js 15 with React 19, TypeScript, and Tailwind CSS
- **Backend**: Convex for serverless backend (database and server functions)
- **Authentication**: Clerk for user authentication
- **UI Components**: shadcn/ui component library (configured in components.json)
- **Package Manager**: pnpm

## Development Commands

```bash
# Install dependencies
pnpm install

# Run development servers (Next.js + Convex)
pnpm run dev

# Run only frontend
pnpm run dev:frontend

# Run only backend
pnpm run dev:backend

# Build for production
pnpm run build

# Start production server
pnpm run start

# Run linter
pnpm run lint
```

## Architecture

### Frontend Structure
- `/app` - Next.js app router pages and layouts
- `/components` - React components including ConvexClientProvider
- `/lib` - Utility functions and shared libraries
- `/public` - Static assets

### Backend Structure
- `/convex` - Convex backend functions and schema
  - `schema.ts` - Database schema definitions
  - `auth.config.ts` - Authentication configuration for Clerk
  - `myFunctions.ts` - Server functions
  - `_generated/` - Auto-generated Convex types

### Authentication Flow
1. Clerk provider wraps the app in `app/layout.tsx`
2. ConvexProviderWithClerk integrates Clerk auth with Convex in `components/ConvexClientProvider.tsx`
3. Middleware in `middleware.ts` protects routes (e.g., `/server`)
4. JWT issuer domain configured via `CLERK_JWT_ISSUER_DOMAIN` environment variable

### Key Configuration Files
- `components.json` - shadcn/ui configuration
- `tsconfig.json` - TypeScript config with `@/*` path alias
- `.env.local` - Environment variables (NEXT_PUBLIC_CONVEX_URL, Clerk keys)

## Important Notes

- The project uses Convex for the backend, which provides real-time database subscriptions and server functions
- Authentication is handled by Clerk and integrated with Convex via JWT templates
- The `/server` route is protected and requires authentication
- UI components should be added using shadcn/ui CLI when needed

## Convex Development Guidelines

### Function Syntax
Always use the new function syntax with explicit args and returns validators:
```typescript
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const myFunction = query({
  args: { name: v.string() },
  returns: v.string(),
  handler: async (ctx, args) => {
    return "Hello " + args.name;
  },
});
```

### Key Convex Patterns
- **Public functions**: Use `query`, `mutation`, `action` for client-accessible APIs
- **Internal functions**: Use `internalQuery`, `internalMutation`, `internalAction` for private functions
- **Function references**: Access via `api.filename.functionName` or `internal.filename.functionName`
- **File-based routing**: Functions in `convex/example.ts` are accessed as `api.example.functionName`

### Database Operations
- Always use indexes with `withIndex()` instead of `filter()` for queries
- Use `ctx.db.insert()`, `ctx.db.patch()`, `ctx.db.replace()`, `ctx.db.delete()` for mutations
- Queries return documents in ascending `_creationTime` order by default
- Use `.order('desc')` for reverse chronological order
- Use `.unique()` to get a single document (throws if multiple match)

### Validators
- Always include `args` and `returns` validators for all functions
- Use `v.null()` for functions that return nothing
- Common validators: `v.string()`, `v.number()`, `v.boolean()`, `v.id("tableName")`, `v.array()`, `v.object()`
- For optional fields use `v.optional()`
- For discriminated unions use `v.union()` with `v.literal()`

### Schema Best Practices
- Define schema in `convex/schema.ts`
- System fields `_id` and `_creationTime` are added automatically
- Name indexes descriptively: `by_field1_and_field2` for compound indexes
- Index fields must be queried in definition order

### TypeScript Types
- Use `Id<"tableName">` from `_generated/dataModel` for document IDs
- Use `Doc<"tableName">` for full document types
- Be strict with ID types - use `Id<"users">` not `string`