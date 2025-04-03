import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@property.com' },
    update: {},
    create: {
      email: 'admin@property.com',
      password: adminPassword,
      name: 'Admin User',
      role: UserRole.ADMIN,
      emailVerified: true,
    },
  });
  console.log('Created admin user:', admin.email);

  // Create landlord user
  const landlordPassword = await bcrypt.hash('landlord123', 10);
  const landlord = await prisma.user.upsert({
    where: { email: 'landlord@property.com' },
    update: {},
    create: {
      email: 'landlord@property.com',
      password: landlordPassword,
      name: 'John Landlord',
      role: UserRole.LANDLORD,
      phone: '+1234567890',
      address: '123 Owner St',
      city: 'New York',
      country: 'USA',
      emailVerified: true,
    },
  });
  console.log('Created landlord user:', landlord.email);

  // Create caretaker user
  const caretakerPassword = await bcrypt.hash('caretaker123', 10);
  const caretaker = await prisma.user.upsert({
    where: { email: 'caretaker@property.com' },
    update: {},
    create: {
      email: 'caretaker@property.com',
      password: caretakerPassword,
      name: 'Mary Caretaker',
      role: UserRole.CARETAKER,
      phone: '+9876543210',
      address: '456 Manager Ave',
      city: 'Chicago',
      country: 'USA',
      emailVerified: true,
    },
  });
  console.log('Created caretaker user:', caretaker.email);

  // Create agent user
  const agentPassword = await bcrypt.hash('agent123', 10);
  const agent = await prisma.user.upsert({
    where: { email: 'agent@property.com' },
    update: {},
    create: {
      email: 'agent@property.com',
      password: agentPassword,
      name: 'Robert Agent',
      role: UserRole.AGENT,
      phone: '+1122334455',
      address: '789 Agent Blvd',
      city: 'Los Angeles',
      country: 'USA',
      emailVerified: true,
    },
  });
  console.log('Created agent user:', agent.email);

  // Create a property
  const property = await prisma.property.upsert({
    where: { id: '550e8400-e29b-41d4-a716-446655440000' },
    update: {},
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
  console.log('Created property:', property.name);

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
