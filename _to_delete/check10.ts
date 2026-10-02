interface Foo { a: string; b: number | null; }
type FooRow = Foo & Record<string, unknown>;
const x: Record<string, unknown> = {} as FooRow;
type T = FooRow extends Record<string, unknown> ? true : false;
const y: T = true;
const z: FooRow = { a: 'hi', b: null };
const w: string = z.a; // property type preserved?
