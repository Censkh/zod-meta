import * as zod from "zod/v4";
import {
  createMetaType,
  findFieldMetaItem,
  getMetaItem,
  getMetaStores,
  getZodTypeFields,
  metaStore,
  removeMetaItem,
  setMetaItem,
} from "../index";

it("1. getMetaItem", () => {
  const primaryKey = createMetaType<{
    alias?: string;
  }>({
    id: "primaryKey",
  });

  const uuidField = zod.string().meta(metaStore([primaryKey()]));

  expect(getMetaItem(uuidField, primaryKey)?.data).toEqual({});

  setMetaItem(uuidField, primaryKey({ alias: "uuid" }));

  expect(getMetaItem(uuidField, primaryKey)?.data).toEqual({
    alias: "uuid",
  });
});

it("2. find", () => {
  const primaryKey = createMetaType<{
    alias?: string;
  }>({
    id: "primaryKey",
  });

  const schema = zod.object({
    id: zod.string().meta(metaStore([primaryKey({ alias: "id" })])),
  });

  expect(findFieldMetaItem(schema, primaryKey)?.data).toEqual({
    alias: "id",
  });
});

it("3. remove", () => {
  const primaryKey = createMetaType<{
    alias?: string;
  }>({
    id: "primaryKey",
  });

  const uuidField = zod.string().meta(metaStore([primaryKey({ alias: "id" })]));

  expect(getMetaItem(uuidField, primaryKey)?.data).toEqual({
    alias: "id",
  });

  removeMetaItem(uuidField, primaryKey);

  expect(getMetaItem(uuidField, primaryKey)).toBeUndefined();
});

it("4. duplicates", () => {
  const number = createMetaType<{
    value: number;
  }>({
    id: "number",
  });

  const required = createMetaType({
    id: "required",
  });

  const uuidField = zod.string().meta(metaStore([number({ value: 1 }), required(), number({ value: 2 })]));
  const stores = getMetaStores(uuidField);
  expect(stores).toHaveLength(1);
  const store = stores[0];
  expect(store).toMatchObject({
    itemMap: {
      required: {},
      number: {
        data: { value: 2 },
      },
    },
    itemList: [
      {
        data: { value: 2 },
      },
      {},
    ],
  });
});

it("5. get zod fields", () => {
  const zodFields = getZodTypeFields(
    zod.object({
      id: zod.string().meta(metaStore([])),
      name: zod.string().meta(metaStore([])),
    }),
  );

  expect(zodFields).toMatchObject([
    {
      key: "id",
    },
    {
      key: "name",
    },
  ]);
});

it("6. nullish and optional with meta", () => {
  const primaryKey = createMetaType<{
    alias?: string;
  }>({
    id: "primaryKey",
  });

  // Test .meta().nullish() - should allow null, undefined, or string
  const nullishField = zod
    .string()
    .meta(metaStore([primaryKey({ alias: "nullishId" })]))
    .nullish();

  expect(getMetaItem(nullishField, primaryKey)?.data).toEqual({
    alias: "nullishId",
  });

  // Test .meta().optional() - should allow undefined or string
  const optionalField = zod
    .string()
    .meta(metaStore([primaryKey({ alias: "optionalId" })]))
    .optional();

  expect(getMetaItem(optionalField, primaryKey)?.data).toEqual({
    alias: "optionalId",
  });

  // Test that the schemas still work for validation
  expect(nullishField.parse("test")).toBe("test");
  expect(nullishField.parse(null)).toBe(null);
  expect(nullishField.parse(undefined)).toBe(undefined);

  expect(optionalField.parse("test")).toBe("test");
  expect(optionalField.parse(undefined)).toBe(undefined);
});

it("7. meta before and after optional", () => {
  const primaryKey = createMetaType<{
    alias?: string;
  }>({
    id: "primaryKey",
  });

  // Test .meta().optional() - meta before optional
  const metaBeforeOptional = zod
    .string()
    .meta(metaStore([primaryKey({ alias: "metaBefore" })]))
    .optional();

  expect(getMetaItem(metaBeforeOptional, primaryKey)?.data).toEqual({
    alias: "metaBefore",
  });

  // Test .optional().meta() - meta after optional
  const metaAfterOptional = zod
    .string()
    .optional()
    .meta(metaStore([primaryKey({ alias: "metaAfter" })]));

  expect(getMetaItem(metaAfterOptional, primaryKey)?.data).toEqual({
    alias: "metaAfter",
  });

  // Test that both schemas still work for validation
  expect(metaBeforeOptional.parse("test")).toBe("test");
  expect(metaBeforeOptional.parse(undefined)).toBe(undefined);

  expect(metaAfterOptional.parse("test")).toBe("test");
  expect(metaAfterOptional.parse(undefined)).toBe(undefined);
});

it("8. meta before and after optional in same chain", () => {
  const primaryKey = createMetaType<{
    alias?: string;
  }>({
    id: "primaryKey",
  });

  const description = createMetaType<{
    text: string;
  }>({
    id: "description",
  });

  // Test .meta().optional().meta() - meta before AND after optional
  const metaBeforeAndAfterOptional = zod
    .string()
    .meta(metaStore([primaryKey({ alias: "beforeOptional" })]))
    .optional()
    .meta(metaStore([description({ text: "afterOptional" })]));

  // Should be able to get both meta items
  expect(getMetaItem(metaBeforeAndAfterOptional, primaryKey)?.data).toEqual({
    alias: "beforeOptional",
  });

  expect(getMetaItem(metaBeforeAndAfterOptional, description)?.data).toEqual({
    text: "afterOptional",
  });

  // Test that the schema still works for validation
  expect(metaBeforeAndAfterOptional.parse("test")).toBe("test");
  expect(metaBeforeAndAfterOptional.parse(undefined)).toBe(undefined);
});
