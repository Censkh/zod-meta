import type * as zod from "zod";

export interface ZodMetaItem<TData = any> {
  type: ZodMetaType<TData>;
  data: TData;
}

export interface ZodMetaStore {
  itemMap: Record<string, ZodMetaItem | undefined>;
  itemList: ZodMetaItem[];
}

type ZodMetaDescription = string & {
  __meta: ZodMetaStore;
};

export interface ZodMetaTypeOptions<TData> {
  id: string;
  check?: ZodMetaCheck<TData>;
}

export interface ZodMetaType<TData> extends ZodMetaTypeOptions<TData> {}

export type ZodMetaFactory<TData> = (TData extends undefined
  ? () => ZodMetaItem<TData>
  : TData extends {}
    ? (value?: TData) => ZodMetaItem<TData>
    : (value: TData) => ZodMetaItem<TData>) &
  ZodMetaType<TData>;

export type ZodMetaCheckResult =
  | {
      success: true;
      message?: undefined;
    }
  | {
      success: false;
      message: string;
    };
type ZodMetaCheck<TData> = (
  type: zod.ZodType,
  value: TData extends {} ? TData | undefined : TData,
) => ZodMetaCheckResult;

export const createMetaType = <TData = undefined>(type: ZodMetaTypeOptions<TData>): ZodMetaFactory<TData> => {
  return Object.assign((value: TData) => {
    return {
      type: type,
      data: value ?? {},
    } as ZodMetaItem<TData>;
  }, type) as ZodMetaFactory<TData>;
};

const createZodMetaDescription = (meta: ZodMetaStore): ZodMetaDescription => {
  return Object.assign("", {
    __meta: meta,
  });
};

export const meta = (meta: ZodMetaItem[]): ZodMetaDescription => {
  const metaMap = meta.reduce(
    (acc, meta) => {
      acc[meta.type.id] = meta;
      return acc;
    },
    {} as Record<string, ZodMetaItem>,
  );
  return createZodMetaDescription({
    itemMap: metaMap,
    get itemList() {
      return Object.values(metaMap);
    },
  });
};

export const getMetaStore = (schema: zod.ZodType): ZodMetaStore | undefined => {
  const meta = (schema as any)._def?.description as ZodMetaDescription | undefined;
  return meta?.__meta;
};

export const ensureMetaStore = (schema: zod.ZodType): ZodMetaStore => {
  let meta = getMetaStore(schema);
  if (!meta) {
    meta = {
      itemMap: {},
      itemList: [],
    };
    if (!schema._def) {
      throw new Error("Schema has no definition");
    }

    schema._def.description = createZodMetaDescription(meta);
  }
  return meta;
};

export const getMetaItem = <TData>(schema: zod.ZodType, type: ZodMetaType<TData>): ZodMetaItem<TData> | undefined => {
  const meta = getMetaStore(schema);
  if (!meta) {
    return;
  }
  return meta.itemMap[type.id] as ZodMetaItem<TData> | undefined;
};

export const setMetaItem = <TData>(schema: zod.ZodType, meta: ZodMetaItem<TData>): void => {
  const metaStore = ensureMetaStore(schema);
  metaStore.itemMap[meta.type.id] = meta as any;
};

export const removeMetaItem = <TData>(schema: zod.ZodType, type: ZodMetaType<TData>) => {
  const meta = getMetaStore(schema);
  if (!meta) {
    return;
  }
  const metaItem = meta.itemMap[type.id];
  if (metaItem) {
    meta.itemMap[type.id] = undefined;
  }
};

export interface FindFieldMetaResult<TData> {
  meta: ZodMetaItem<TData>;
  key: string;
  data: TData;
  schema: zod.ZodType;
}

export const findFieldMetaItem = <TData>(
  schema: zod.ZodObject<any>,
  type: ZodMetaType<TData>,
): FindFieldMetaResult<TData> | undefined => {
  if (!schema._def.shape) {
    return;
  }

  for (const key in schema._def.shape()) {
    const value = schema._def.shape()[key];
    const meta = getMetaItem(value, type);
    if (meta) {
      return {
        meta,
        key,
        schema: value,
        data: meta.data,
      };
    }
  }
};

export const findFieldMetaItems = <TData>(
  schema: zod.ZodObject<any>,
  type: ZodMetaType<TData>,
): FindFieldMetaResult<TData>[] => {
  if (!schema._def.shape) {
    return [];
  }
  const results: FindFieldMetaResult<TData>[] = [];
  for (const key in schema._def.shape()) {
    const value = schema._def.shape()[key];
    const meta = getMetaItem(value, type);
    if (meta) {
      results.push({
        meta,
        key,
        schema: value,
        data: meta.data,
      });
    }
  }
  return results;
};
