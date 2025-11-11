# ESLint 9 Migration Notes

## Changes Made

1. Upgraded ESLint from v8.57.0 to v9.39.1
2. Migrated from `.eslintrc.json` to `eslint.config.mjs` (flat config)
3. Added new dependencies:
   - `@eslint/eslintrc@^3.2.0` (for FlatCompat)
   - `@eslint/js@^9.17.0` (for recommended configs)
4. Updated `eslint-plugin-prettier` to v5.2.2
5. Removed deprecated `.eslintignore` file

## Key Differences

- **Removed:** `createDefaultProgram` parser option (deprecated)
- **Removed:** `.eslintrc.json` and `.eslintignore` files
- **Added:** Ignore patterns directly in flat config
- **Using:** FlatCompat to bridge Next.js presets to flat config

## Verification

- ✓ `npm run lint` passes (0 errors, 0 warnings)
- ✓ `npm run lint:fix` works correctly
- ✓ `npm run build` succeeds
- ✓ `npm run prettier` works correctly
- ✓ TypeScript compilation passes (`npx tsc --noEmit`)
- ✓ VS Code ESLint extension compatible
- ✓ All custom rules preserved

## Migration Details

### Package Changes

**Added:**
- `@eslint/eslintrc`: ^3.2.0
- `@eslint/js`: ^9.17.0

**Updated:**
- `eslint`: ^8.57.0 → ^9.17.0 (installed: v9.39.1)
- `eslint-plugin-prettier`: ^5.2.1 → ^5.2.2

### Configuration Migration

**Old Config (`.eslintrc.json`):**
- JSON-based configuration
- Separate `.eslintignore` file
- Legacy extends format

**New Config (`eslint.config.mjs`):**
- ES Module format
- Flat configuration structure
- Inline ignore patterns
- FlatCompat for Next.js preset compatibility

### Preserved Rules

All custom rules from v8 config were successfully migrated:
- React rules (jsx-filename-extension, prop-types, etc.)
- Import rules (order, no-cycle, etc.)
- TypeScript rules (naming-convention, no-unused-vars)
- Material-UI import restrictions
- Prettier integration

## Rollback

To rollback to ESLint v8:

1. Restore `.eslintrc.json` from backup:
   ```bash
   mv .eslintrc.json.backup .eslintrc.json
   ```

2. Delete new flat config:
   ```bash
   rm eslint.config.mjs
   ```

3. Downgrade ESLint packages:
   ```bash
   npm install --save-dev eslint@^8.57.0 eslint-plugin-prettier@^5.2.1
   npm remove @eslint/eslintrc @eslint/js
   ```

4. Reinstall dependencies:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

## VS Code Configuration

If using VS Code with ESLint extension, you may need to add to `.vscode/settings.json`:

```json
{
  "eslint.experimental.useFlatConfig": true,
  "eslint.options": {
    "overrideConfigFile": "eslint.config.mjs"
  }
}
```

## Notes

- ESLint v9 uses flat config by default
- FlatCompat is a compatibility layer for older ESLint configs
- The Next.js plugin warning is informational and can be ignored
- All linting functionality preserved from v8 config
- Build and development workflows unaffected

## Date Completed

November 11, 2025

## Branch

`upgrade/phase-3-eslint-v9`
