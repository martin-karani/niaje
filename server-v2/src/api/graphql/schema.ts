import { getDb } from "@/db";
import { buildSchema } from "drizzle-graphql";

export const { schema: graphqlSchema, entities } = buildSchema(getDb(), {
  relationsDepthLimit: 2,
});
