import * as zod from "zod";
import { createZodMetaBuilder, findFieldMeta, getMetaItem, meta, removeMetaItem, setMetaItem } from "../index";

test("1. getMetaItem", () => {
  const primaryKey = createZodMetaBuilder<{
    alias?: string;
  }>({
    id: "primaryKey",
  });

  const uuidField = zod.string().describe(meta([primaryKey({ alias: "id" })]));

  expect(getMetaItem(uuidField, primaryKey)?.value).toEqual({
    alias: "id",
  });

  setMetaItem(uuidField, primaryKey({ alias: "uuid" }));

  expect(getMetaItem(uuidField, primaryKey)?.value).toEqual({
    alias: "uuid",
  });
});

test("2. find", () => {
  const primaryKey = createZodMetaBuilder<{
    alias?: string;
  }>({
    id: "primaryKey",
  });

  const schema = zod.object({
    id: zod.string().describe(meta([primaryKey({ alias: "id" })])),
  });

  expect(findFieldMeta(schema, primaryKey)?.value).toEqual({
    alias: "id",
  });
});

test("3. remove", () => {
  const primaryKey = createZodMetaBuilder<{
    alias?: string;
  }>({
    id: "primaryKey",
  });

  const schema = zod.object({
    id: zod.string().describe(meta([primaryKey({ alias: "id" })])),
  });

  const uuidField = zod.string().describe(meta([primaryKey({ alias: "id" })]));

  expect(getMetaItem(uuidField, primaryKey)?.value).toEqual({
    alias: "id",
  });

  removeMetaItem(uuidField, primaryKey);

  expect(getMetaItem(uuidField, primaryKey)).toBeUndefined();
});
