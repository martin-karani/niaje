import * as bcrypt from "bcrypt";
import dotenv from "dotenv";
import { eq, and } from "drizzle-orm";
import { getDb } from "../src/db";
import { users, accounts, properties } from "../src/db/schema";

dotenv.config();

async function createUserWithAccount(userData: {
  email: string;
  passwordPlainText: string;
  name: string;
  role: "LANDLORD" | "CARETAKER" | "AGENT" | "ADMIN";
  emailVerified?: boolean;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
}) {
  const existingUser = await getDb.query.users.findFirst({
    where: eq(users.email, userData.email),
  });

  let user;

  if (existingUser) {
    const [updatedUser] = await getDb
      .update(users)
      .set({
        name: userData.name,
        role: userData.role,
        phone: userData.phone,
        address: userData.address,
        city: userData.city,
        country: userData.country,
        emailVerified: userData.emailVerified ?? false,
        updatedAt: new Date(),
      })
      .where(eq(users.email, userData.email))
      .returning();

    user = updatedUser;
  } else {
    // Create new user
    const [newUser] = await getDb
      .insert(users)
      .values({
        email: userData.email,
        name: userData.name,
        role: userData.role,
        emailVerified: userData.emailVerified ?? false,
        phone: userData.phone,
        address: userData.address,
        city: userData.city,
        country: userData.country,
        updatedAt: new Date(),
      })
      .returning();

    user = newUser;
  }

  // Hash the password for the Account model
  const hashedPassword = await bcrypt.hash(userData.passwordPlainText, 10);

  // Find existing account
  const existingAccount = await getDb.query.accounts.findFirst({
    where: and(
      eq(accounts.providerId, "emailpassword"),
      eq(accounts.userId, user.id)
    ),
  });

  if (existingAccount) {
    // Update existing account
    await getDb
      .update(accounts)
      .set({
        password: hashedPassword,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(accounts.providerId, "emailpassword"),
          eq(accounts.userId, user.id)
        )
      );
  } else {
    // Create new account
    await getDb.insert(accounts).values({
      userId: user.id,
      providerId: "emailpassword",
      accountId: user.id,
      password: hashedPassword,
      updatedAt: new Date(),
    });
  }

  console.log(
    `Upserted user ${user.email} and associated emailpassword account.`
  );
  return user;
}

async function main() {
  console.log("Seeding database...");

  // Create users using the helper function
  const admin = await createUserWithAccount({
    email: "admin@property.com",
    passwordPlainText: "admin123",
    name: "Admin User",
    role: "ADMIN",
    emailVerified: true,
  });

  const landlord = await createUserWithAccount({
    email: "landlord@property.com",
    passwordPlainText: "landlord123",
    name: "John Landlord",
    role: "LANDLORD",
    phone: "+1234567890",
    address: "123 Owner St",
    city: "New York",
    country: "USA",
    emailVerified: true,
  });

  const caretaker = await createUserWithAccount({
    email: "caretaker@property.com",
    passwordPlainText: "caretaker123",
    name: "Mary Caretaker",
    role: "CARETAKER",
    phone: "+9876543210",
    address: "456 Manager Ave",
    city: "Chicago",
    country: "USA",
    emailVerified: true,
  });

  const agent = await createUserWithAccount({
    email: "agent@property.com",
    passwordPlainText: "agent123",
    name: "Robert Agent",
    role: "AGENT",
    phone: "+1122334455",
    address: "789 Agent Blvd",
    city: "Los Angeles",
    country: "USA",
    emailVerified: true,
  });

  // Check if property exists
  const existingProperty = await getDb.query.properties.findFirst({
    where: eq(properties.name, "Luxury Apartment Complex"),
  });

  if (existingProperty) {
    // Update existing property
    await getDb
      .update(properties)
      .set({
        ownerId: landlord.id,
        caretakerId: caretaker.id,
        agentId: agent.id,
        updatedAt: new Date(),
      })
      .where(eq(properties.name, "Luxury Apartment Complex"));

    console.log("Updated property: Luxury Apartment Complex");
  } else {
    // Create new property
    const [property] = await getDb
      .insert(properties)
      .values({
        name: "Luxury Apartment Complex",
        address: "123 Main St, New York, NY",
        type: "Apartment",
        description: "A beautiful apartment complex with 20 units",
        ownerId: landlord.id,
        caretakerId: caretaker.id,
        agentId: agent.id,
        updatedAt: new Date(),
      })
      .returning();

    console.log(`Created property: ${property.name}`);
  }

  console.log("Seeding completed!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    // Close the database connection
    process.exit(0);
  });
