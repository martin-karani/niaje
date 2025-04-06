import dotenv from "dotenv";
import { seed, reset } from "drizzle-seed";
import { db } from "../src/db";
import * as schema from "../src/db/schema";

// Load environment variables
dotenv.config();

async function main() {
  console.log("Seeding database...");

  // First reset the database (optional)
  if (process.argv.includes("--reset")) {
    console.log("Resetting database before seeding...");
    await reset(db, schema);
  }

  // Seed the database with refined data
  await seed(db, schema).refine((f) => ({
    // Users refinement
    users: {
      count: 4, // We're creating 4 specific users
      columns: {
        email: f.valuesFromArray({
          values: [
            "admin@property.com",
            "landlord@property.com",
            "caretaker@property.com",
            "agent@property.com",
          ],
          isUnique: true,
        }),
        name: f.valuesFromArray({
          values: [
            "Admin User",
            "John Landlord",
            "Mary Caretaker",
            "Robert Agent",
          ],
        }),
        role: f.valuesFromArray({
          values: ["ADMIN", "LANDLORD", "CARETAKER", "AGENT"],
        }),
        emailVerified: f.default({ defaultValue: true }),
        phone: f.valuesFromArray({
          values: ["", "+1234567890", "+9876543210", "+1122334455"],
        }),
        address: f.valuesFromArray({
          values: ["", "123 Owner St", "456 Manager Ave", "789 Agent Blvd"],
        }),
        city: f.valuesFromArray({
          values: ["", "New York", "Chicago", "Los Angeles"],
        }),
        country: f.valuesFromArray({
          values: ["", "USA", "USA", "USA"],
        }),
      },
      // For each user, we need to create an associated account
      with: {
        accounts: 1,
      },
    },
    // Accounts refinement
    accounts: {
      columns: {
        // Link accounts to the corresponding users
        providerId: f.default({ defaultValue: "emailpassword" }),
        // For password, you'd typically handle this separately since drizzle-seed
        // doesn't hash passwords by default. We'll handle passwords post-seeding.
      },
    },
    // Properties refinement
    properties: {
      count: 1,
      columns: {
        name: f.default({ defaultValue: "Luxury Apartment Complex" }),
        address: f.default({ defaultValue: "123 Main St, New York, NY" }),
        type: f.default({ defaultValue: "Apartment" }),
        description: f.default({
          defaultValue: "A beautiful apartment complex with 20 units",
        }),
      },
    },
  }));

  // After seeding, we need to manually set passwords since drizzle-seed doesn't handle hashing
  console.log("Setting up passwords for users...");
  await setupPasswords();

  // After seeding, we need to manually link properties to users
  console.log("Linking properties to users...");
  await linkPropertiesToUsers();

  console.log("Seeding completed!");
}

// Helper function to set up passwords for accounts
async function setupPasswords() {
  const bcrypt = require("bcrypt");

  // Get users with their accounts
  const adminUser = await db.query.users.findFirst({
    where: (users, { eq }) => eq(users.email, "admin@property.com"),
  });

  const landlordUser = await db.query.users.findFirst({
    where: (users, { eq }) => eq(users.email, "landlord@property.com"),
  });

  const caretakerUser = await db.query.users.findFirst({
    where: (users, { eq }) => eq(users.email, "caretaker@property.com"),
  });

  const agentUser = await db.query.users.findFirst({
    where: (users, { eq }) => eq(users.email, "agent@property.com"),
  });

  if (adminUser) {
    const adminAccount = await db.query.accounts.findFirst({
      where: (accounts, { eq }) => eq(accounts.userId, adminUser.id),
    });

    if (adminAccount) {
      const hashedPassword = await bcrypt.hash("admin123", 10);
      await db
        .update(schema.accounts)
        .set({ password: hashedPassword })
        .where((accounts, { eq }) => eq(accounts.id, adminAccount.id));
    }
  }

  if (landlordUser) {
    const landlordAccount = await db.query.accounts.findFirst({
      where: (accounts, { eq }) => eq(accounts.userId, landlordUser.id),
    });

    if (landlordAccount) {
      const hashedPassword = await bcrypt.hash("landlord123", 10);
      await db
        .update(schema.accounts)
        .set({ password: hashedPassword })
        .where((accounts, { eq }) => eq(accounts.id, landlordAccount.id));
    }
  }

  if (caretakerUser) {
    const caretakerAccount = await db.query.accounts.findFirst({
      where: (accounts, { eq }) => eq(accounts.userId, caretakerUser.id),
    });

    if (caretakerAccount) {
      const hashedPassword = await bcrypt.hash("caretaker123", 10);
      await db
        .update(schema.accounts)
        .set({ password: hashedPassword })
        .where((accounts, { eq }) => eq(accounts.id, caretakerAccount.id));
    }
  }

  if (agentUser) {
    const agentAccount = await db.query.accounts.findFirst({
      where: (accounts, { eq }) => eq(accounts.userId, agentUser.id),
    });

    if (agentAccount) {
      const hashedPassword = await bcrypt.hash("agent123", 10);
      await db
        .update(schema.accounts)
        .set({ password: hashedPassword })
        .where((accounts, { eq }) => eq(accounts.id, agentAccount.id));
    }
  }
}

// Helper function to link properties to users
async function linkPropertiesToUsers() {
  const landlordUser = await db.query.users.findFirst({
    where: (users, { eq }) => eq(users.email, "landlord@property.com"),
  });

  const caretakerUser = await db.query.users.findFirst({
    where: (users, { eq }) => eq(users.email, "caretaker@property.com"),
  });

  const agentUser = await db.query.users.findFirst({
    where: (users, { eq }) => eq(users.email, "agent@property.com"),
  });

  if (landlordUser && caretakerUser && agentUser) {
    // Get the property
    const property = await db.query.properties.findFirst();

    if (property) {
      // Update the property with user IDs
      await db
        .update(schema.properties)
        .set({
          ownerId: landlordUser.id,
          caretakerId: caretakerUser.id,
          agentId: agentUser.id,
        })
        .where((properties, { eq }) => eq(properties.id, property.id));
    }
  }
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
