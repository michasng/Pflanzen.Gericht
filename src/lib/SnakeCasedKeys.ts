export type SnakeCase<S extends string> = S extends `${infer Head}${infer Tail}`
  ? Tail extends Uncapitalize<Tail>
    ? `${Lowercase<Head>}${SnakeCase<Tail>}`
    : `${Lowercase<Head>}_${SnakeCase<Uncapitalize<Tail>>}`
  : S

export type SnakeCasedKeys<T> = T extends readonly (infer Item)[]
  ? SnakeCasedKeys<Item>[]
  : T extends object
    ? { [K in keyof T as SnakeCase<K & string>]: SnakeCasedKeys<T[K]> }
    : T
