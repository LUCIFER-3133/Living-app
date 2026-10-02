import type { Database } from '@/types/database';

type GenericRelationship = {
  foreignKeyName: string;
  columns: string[];
  isOneToOne?: boolean;
  referencedRelation: string;
  referencedColumns: string[];
};
type GenericTable = {
  Row: Record<string, unknown>;
  Insert: Record<string, unknown>;
  Update: Record<string, unknown>;
  Relationships: GenericRelationship[];
};
type GenericView = { Row: Record<string, unknown>; Relationships: GenericRelationship[] };
type GenericFunction = { Args: Record<string, unknown> | never; Returns: unknown };
type GenericSchema = {
  Tables: Record<string, GenericTable>;
  Views: Record<string, GenericView>;
  Functions: Record<string, GenericFunction>;
};

type Pub = Omit<Database, '__InternalSupabase'>['public'];
type Check = Pub extends GenericSchema ? 'YES' : 'NO';
const c: Check = 'YES';
