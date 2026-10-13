import 'dotenv/config'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../app/generated/prisma/client'

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
  ssl: { rejectUnauthorized: false },
})

const prisma = new PrismaClient({ adapter })

async function main() {
  const count = await prisma.user.count()
  const users = await prisma.user.findMany({
    select: { email: true, nama: true, role: true },
  })
  console.log('✅ Koneksi berhasil')
  console.log('Total users:', count)
  console.log('Users:', users)
}

main()
  .catch((e) => {
    console.error('❌ ERROR:', e.message)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })