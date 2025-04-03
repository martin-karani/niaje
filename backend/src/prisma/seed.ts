import { PrismaClient, UserRole, Account } from '@prisma/client'; // Add Account
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// Helper function to create user and associated email/password account
async function createUserWithAccount(userData: {
  email: string;
  passwordPlainText: string; // Plain text password for hashing
  name: string;
  role: UserRole;
  emailVerified?: boolean;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
}) {
  const user = await prisma.user.upsert({
    where: { email: userData.email },
    update: {
      // Update existing user data if needed, but don't overwrite password here
      name: userData.name,
      role: userData.role,
      phone: userData.phone,
      address: userData.address,
      city: userData.city,
      country: userData.country,
      emailVerified: userData.emailVerified ?? false,
    },
    create: {
      email: userData.email,
      name: userData.name,
      role: userData.role,
      emailVerified: userData.emailVerified ?? false,
      phone: userData.phone,
      address: userData.address,
      city: userData.city,
      country: userData.country,
      // DO NOT store password on User model
    },
  });

  // Hash the password for the Account model
  const hashedPassword = await bcrypt.hash(userData.passwordPlainText, 10);

  // Create or update the corresponding Account for email/password
  const account = await prisma.account.upsert({
    where: {
      // Unique constraint based on provider and accountId (which is userId for email/password)
      providerId_accountId: { providerId: 'emailpassword', accountId: user.id },
    },
    update: {
      // Update password if user already existed and we're re-seeding
      password: hashedPassword,
    },
    create: {
      userId: user.id,
      providerId: 'emailpassword', // Identifier for this auth method
      accountId: user.id, // For email/password, accountId is typically the userId
      password: hashedPassword, // Store hashed password here
    },
  });

  console.log(
    `Upserted user ${user.email} and associated emailpassword account.`,
  );
  return user; // Return the created/updated user
}

async function main() {
  console.log('Seeding database...');

  // Create users using the helper function
  const admin = await createUserWithAccount({
    email: 'admin@property.com',
    passwordPlainText: 'admin123',
    name: 'Admin User',
    role: UserRole.ADMIN,
    emailVerified: true,
  });

  const landlord = await createUserWithAccount({
    email: 'landlord@property.com',
    passwordPlainText: 'landlord123',
    name: 'John Landlord',
    role: UserRole.LANDLORD,
    phone: '+1234567890',
    address: '123 Owner St',
    city: 'New York',
    country: 'USA',
    emailVerified: true,
  });

  const caretaker = await createUserWithAccount({
    email: 'caretaker@property.com',
    passwordPlainText: 'caretaker123',
    name: 'Mary Caretaker',
    role: UserRole.CARETAKER,
    phone: '+9876543210',
    address: '456 Manager Ave',
    city: 'Chicago',
    country: 'USA',
    emailVerified: true,
  });

  const agent = await createUserWithAccount({
    email: 'agent@property.com',
    passwordPlainText: 'agent123',
    name: 'Robert Agent',
    role: UserRole.AGENT,
    phone: '+1122334455',
    address: '789 Agent Blvd',
    city: 'Los Angeles',
    country: 'USA',
    emailVerified: true,
  });

  // --- Seed Properties (Keep as is or adjust as needed) ---
  const property = await prisma.property.upsert({
    where: { id: '550e8400-e29b-41d4-a716-446655440000' }, // Use a consistent ID or remove for auto-generation
    update: {
      // Ensure relations are updated if users were updated
      ownerId: landlord.id,
      caretakerId: caretaker.id,
      agentId: agent.id,
    },
    create: {
      id: '550e8400-e29b-41d4-a716-446655440000',
      name: 'Luxury Apartment Complex',
      address: '123 Main St, New York, NY',
      type: 'Apartment',
      description: 'A beautiful apartment complex with 20 units',
      ownerId: landlord.id,
      caretakerId: caretaker.id,
      agentId: agent.id,
    },
  });
  console.log('Upserted property:', property.name);

  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
