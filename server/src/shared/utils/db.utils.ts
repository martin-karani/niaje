import { SQL, sql } from "drizzle-orm";

/**
 * Check if a value is in an array
 */
export function inArray<T>(column: SQL<T>, values: T[]): SQL<boolean> {
  if (values.length === 0) {
    return sql`false`;
  }
  return sql`${column} = ANY(ARRAY[${values.join(",")}])`;
}

/**
 * Check if a value is NOT in an array
 */
export function notInArray<T>(column: SQL<T>, values: T[]): SQL<boolean> {
  if (values.length === 0) {
    return sql`true`;
  }
  return sql`${column} != ALL(ARRAY[${values.join(",")}])`;
}

/**
 * Logical OR for conditions
 */
export function or(...conditions: SQL<boolean>[]): SQL<boolean> {
  if (conditions.length === 0) {
    return sql`true`;
  }

  return sql.join(
    conditions.map((condition) => sql`(${condition})`),
    sql` OR `
  );
}
