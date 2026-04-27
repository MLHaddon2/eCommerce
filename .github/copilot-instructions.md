<!-- GitHub Copilot Custom Instructions -->
<!-- See: https://docs.github.com/copilot/customizing-copilot -->

## Project Context

A JavaScript project using Express. Contains 96 files across 16 directories.

## Stack

**Languages:**
- JavaScript (93%)
- CSS (4%)
- HTML (2%)
- SQL (2%)

**Frameworks & Tools:**
- Express (api)
- Sequelize (orm)

## Commands

```bash
npm run dev  # dev
npm run build  # build
npm run start  # start
```

## Conventions

- **Naming**: mixed
- **File organization**: flat

## Architecture

**Entry points:** index.js

**Key directories:**
- `client/` - Client-side code
- `config/` - Configuration files
- `Controllers/`
- `middleware/` - Middleware functions
- `models/` - Data models / dbt models
- `routes/` - Route handlers

## Boundaries

**Always:**
- Run existing tests before committing changes
- Follow mixed naming convention
- Follow flat file organization

**Ask first:**
- Adding new dependencies
- Changing project configuration files

**Never:**
- Commit secrets, API keys, or .env files
- Delete or overwrite test files without understanding them
- Force push to main/master branch

<!-- agentseed:meta {"sha":"cce150def603d1b14949eedc2c93c631159919f7","timestamp":"2026-04-07T12:56:15.345Z","format":"agentseed-v1"} -->
