import * as zod from "zod/v4";
import {
  createMetaType,
  findFieldMetaItem,
  getMetaItem,
  getMetaStore,
  getZodTypeFields,
  meta,
  removeMetaItem,
  setMetaItem,
} from "../index";

it("1. getMetaItem", () => {
  const primaryKey = createMetaType<{
    alias?: string;
  }>({
    id: "primaryKey",
  });

  const uuidField = zod.string().meta(meta([primaryKey()]));

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
    id: zod.string().meta(meta([primaryKey({ alias: "id" })])),
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

  const uuidField = zod.string().meta(meta([primaryKey({ alias: "id" })]));

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

  const uuidField = zod.string().meta(meta([number({ value: 1 }), required(), number({ value: 2 })]));
  const store = getMetaStore(uuidField);
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
      id: zod.string().meta(meta([])),
      name: zod.string().meta(meta([])),
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
