import * as zod from "zod";

export interface ZodMetaItem<TValue = unknown> {
  definition: ZodMetaDefinition<TValue>;
  value: TValue;
}

export interface ZodMetaStore {
  metaMap: Record<string, ZodMetaItem>,
  metaList: ZodMetaItem[]
}

type ZodMetaDescription = string & {
  __meta: ZodMetaStore;
};

export interface ZodMetaDefinitionOptions<T> {
  id: string;
  check?: ZodMetaCheck<T>;
}

type EmptyObject = Record<string, never>;

export type ZodMetaDefinition<TValue> = (void extends TValue
  ? () => ZodMetaItem<TValue>
  : TValue extends EmptyObject
    ? (value?: TValue) => ZodMetaItem<TValue>
    : (value: TValue) => ZodMetaItem<TValue>) & {
  id: string;
  check: (type: zod.ZodType, value: TValue) => ZodMetaCheckResult;
};

type ZodMetaCheckResult =
  | {
  success: true;
}
  | {
  success: false;
  message: string;
};
type ZodMetaCheck<TValue> = (type: zod.ZodType, value: TValue extends {} ? TValue | undefined : TValue) => ZodMetaCheckResult;

export const createZodMetaBuilder = <TValue = undefined>(definition: ZodMetaDefinitionOptions<TValue>): ZodMetaDefinition<TValue> => {
  // @ts-ignore
  return Object.assign((value: TValue) => {
    return {
      definition,
      value: value,
    } as ZodMetaItem<TValue>;
  }, definition);
};

const createZodMetaDescription = (meta: ZodMetaStore): ZodMetaDescription => {
  return Object.assign("", {
    __meta: meta,
  });
}

export const meta = (meta: ZodMetaItem[]): ZodMetaDescription => {
  const metaMap = meta.reduce((acc, meta) => {
    acc[meta.definition.id] = meta;
    return acc;
  }, {} as Record<string, ZodMetaItem>);
  return createZodMetaDescription({
    metaMap,
    metaList: meta,
  })
};

export const getMetaStore = (schema: zod.ZodType): ZodMetaStore | undefined => {
  const meta = (schema as any)._def?.description as ZodMetaDescription | undefined;
  return meta?.__meta;
};

export const ensureMetaStore = (schema: zod.ZodType): ZodMetaStore => {
  let meta = getMetaStore(schema);
  if (!meta) {
    meta = {
      metaMap: {},
      metaList: [],
    };
    if (!schema._def) {
      throw new Error("Schema has no definition");
    }

    schema._def.description = createZodMetaDescription(meta);
  }
  return meta;
}

export const getMetaItem = <TValue>(schema: zod.ZodType, metaDef: ZodMetaDefinition<TValue>): ZodMetaItem<TValue> | undefined => {
  const meta = getMetaStore(schema);
  if (!meta) {
    return;
  }
  return meta.metaMap[metaDef.id] as (ZodMetaItem<TValue> | undefined);
};

export const setMetaItem = <TValue>(schema: zod.ZodType, meta: ZodMetaItem<TValue>): zod.ZodType => {
  let metaStore = ensureMetaStore(schema);
  const exisingMeta = metaStore.metaMap[meta.definition.id];
  if (exisingMeta) {
    metaStore.metaList.splice(metaStore.metaList.indexOf(exisingMeta), 1);
  }

  metaStore.metaMap[meta.definition.id] = meta as any;
  metaStore.metaList.push(meta as any);
  return schema;
}

export const removeMetaItem = <TValue>(schema: zod.ZodType, metaDef: ZodMetaDefinition<TValue>) => {
  const meta = getMetaStore(schema);
  if (!meta) {
    return ;
  }
  const metaItem = meta.metaMap[metaDef.id];
  if (metaItem) {
    delete meta.metaMap[metaDef.id];
    meta.metaList.splice(meta.metaList.indexOf(metaItem), 1);
  }
}


export interface FindFieldMetaResult<TValue> {
  meta: ZodMetaItem<TValue>;
  key: string;
  value: TValue;
  schema: zod.ZodType;
}

export const findFieldMeta = <TValue>(
  schema: zod.ZodObject<any>,
  metaDef: ZodMetaDefinition<TValue>,
): FindFieldMetaResult<TValue> | undefined => {
  for (const key in schema._def.shape()) {
    const value = schema._def.shape()[key];
    const meta = getMetaItem(value, metaDef);
    if (meta) {
      return {
        meta,
        key,
        schema: value,
        value: meta.value,
      };
    }
  }
};
