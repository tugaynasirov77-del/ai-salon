// Создать User и привязать к существующему Salon.
// Использование:
//   npx tsx scripts/createUserForSalon.ts <salonId> <email> <password>
import { config } from 'dotenv';
config({ override: true });
import bcrypt from 'bcryptjs';
import prisma from '../src/db/prisma';

async function main() {
  const [, , salonId, email, password] = process.argv;
  if (!salonId || !email || !password) {
    console.error('Usage: createUserForSalon.ts <salonId> <email> <password>');
    process.exit(1);
  }

  const salon = await prisma.salon.findUnique({ where: { id: salonId } });
  if (!salon) {
    console.error(`Salon ${salonId} не найден`);
    process.exit(1);
  }

  const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (existing) {
    console.error(`User с email ${email} уже существует (id=${existing.id})`);
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      email: email.toLowerCase(),
      passwordHash,
      name: salon.ownerName,
      role: 'owner',
      salonId: salon.id,
    },
  });

  console.log(`✅ Создан пользователь ${user.email} (id=${user.id}) для салона "${salon.name}" (${salon.id})`);
  console.log(`Логин: ${user.email}`);
  console.log(`Пароль: ${password}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
