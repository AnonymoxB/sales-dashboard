import 'dotenv/config'
import prisma from '../lib/prisma'
import { DEFAULT_PERMISSIONS } from '../lib/rbac-resources'

async function main() {
  console.log('🌱 Seeding role permissions...\n')

  // Hapus dulu
  await prisma.rolePermission.deleteMany()

  let total = 0
  for (const [role, resources] of Object.entries(DEFAULT_PERMISSIONS)) {
    for (const resource of resources) {
      await prisma.rolePermission.create({
        data: {
          role: role as 'ADMIN' | 'MANAGER' | 'SALES',
          resource,
        },
      })
      total++
    }
  }

  console.log(`✅ ${total} permissions created\n`)

  const summary = await prisma.rolePermission.groupBy({
    by: ['role'],
    _count: { resource: true },
  })
  console.table(
    summary.map((s) => ({ role: s.role, permissions: s._count.resource }))
  )
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())