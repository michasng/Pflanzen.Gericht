export type CamelCase<S extends string> = S extends `${infer Head}_${infer Tail}`
  ? `${Head}${Capitalize<CamelCase<Tail>>}`
  : S

export type CamelCasedKeys<T> = T extends readonly (infer Item)[]
  ? CamelCasedKeys<Item>[]
  : T extends object
    ? { [K in keyof T as CamelCase<K & string>]: CamelCasedKeys<T[K]> }
    : T
