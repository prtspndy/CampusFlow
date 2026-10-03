import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding canonical RBAC accounts...');
  const passwordHash = await bcrypt.hash('Password1', 10);

  const seedUsers = [
    {
      email: 'admin@campus.edu',
      name: 'Campus President',
      role: UserRole.ADMIN,
    },
    {
      email: 'eventmanager@campus.edu',
      name: 'Evan Manager',
      role: UserRole.EVENT_MANAGER,
    },
    {
      email: 'treasurer@campus.edu',
      name: 'Trea Surer',
      role: UserRole.TREASURER,
    },
    {
      email: 'member@campus.edu',
      name: 'Ada Student',
      role: UserRole.MEMBER,
    },
  ];

  for (const user of seedUsers) {
    const existing = await prisma.user.findUnique({ where: { email: user.email } });
    if (!existing) {
      await prisma.user.create({
        data: {
          email: user.email,
          name: user.name,
          passwordHash,
          role: user.role,
          status: 'active',
        },
      });
      console.log(`Created seed user: ${user.email} (${user.role})`);
    } else {
      await prisma.user.update({
        where: { email: user.email },
        data: { role: user.role, status: 'active' },
      });
      console.log(`Updated seed user: ${user.email} (${user.role})`);
    }
  }

  console.log('RBAC seed complete!');
}

main()
  .catch((e) => {
    console.error('Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
