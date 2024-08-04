# zod-meta

Get/set metadata on Zod schemas

## Get Started

```bash
npm install zod-meta
```

1. Create your first meta type, for example a primary key data:

```typescript file=primaryKey.ts
import { createMetaType } from "zod-meta";

export interface PrimaryKeyData {
  autoIncrement?: boolean;
}

export const primaryKey = createMetaType<PrimaryKeyData>({
  id: "primaryKey",
});
```

2. Add some meta to your schema:

```typescript
import * as z from "zod";
import {primaryKey} from "./primaryKey";

const schema = z.object({
  id: z.number().describe(meta([
    primaryKey({ autoIncrement: true })
  ])),
  name: z.string(),
});
```

3. Retrieve the meta from the schema:

```typescript
import { findFieldMetaItem } from "zod-meta";
import { primaryKey } from "./primaryKey";

const primaryKeyField = findFieldMetaItem(schema, primaryKey);

console.log(primaryKeyField.key); // "id"
console.log(primaryKeyField.data.autoIncrement); // true
console.log(primaryKeyField.schema); // ZodNumber

```

## API

### `getMetaItem<T>(schema: ZodSchema, type: ZodMetaType<T>): ZodMetaItem<T> | undefined`

Get a metadata item from a schema

### `setMetaItem<T>(schema: ZodSchema, type: ZodMetaType<T>, data: T): void`

Set a metadata item on a schema

### `findFieldMetaItem<T>(schema: ZodSchema, type: ZodMetaType<T>): FindFieldMetaResult<T> | undefined`

Find the first field in an object that has a metadata item of a certain type

Returns the field schema, the key and the data

### `findFieldMetaItems<T>(schema: ZodSchema, type: ZodMetaType<T>): FindFieldMetaResult<T>[]`

Find all fields in an object that have a metadata item of a certain type

### `removeMetaItem<T>(schema: ZodSchema, type: ZodMetaType<T>): void`

Remove a metadata item from a schema

### `getMetaStore(schema: ZodSchema): ZodMetaStore`

Get the metadata store for a schema which contains all metadata items

### `ensureMetaStore(schema: ZodSchema): ZodMetaStore`

Gets or creates the metadata store for a schema