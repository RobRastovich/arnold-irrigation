import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding navigation...')

  const existing = await prisma.navGroup.count()
  if (existing > 0) {
    console.log('Navigation already seeded, skipping.')
    return
  }

  const groups = [
    {
      label: 'The District',
      sortOrder: 1,
      links: [
        { label: 'History', url: '/district/history', sortOrder: 1 },
        { label: 'Board of Directors', url: '/district/board', sortOrder: 2 },
        { label: 'Staff', url: '/district/staff', sortOrder: 3 },
        { label: 'Board Meetings', url: '/district/meetings', sortOrder: 4 },
      ],
    },
    {
      label: 'Operations',
      sortOrder: 2,
      links: [
        { label: 'Projects', url: '/operations/projects', sortOrder: 1 },
        { label: 'Canal Piping', url: '/operations/canal', sortOrder: 2 },
      ],
    },
    {
      label: 'Resources',
      sortOrder: 3,
      links: [
        { label: 'Useful Topics', url: '/resources/topics', sortOrder: 1 },
        { label: 'Manuals', url: '/resources/manuals', sortOrder: 2 },
        { label: 'Forms', url: '/resources/forms', sortOrder: 3 },
        { label: 'Links', url: '/resources/links', sortOrder: 4 },
      ],
    },
  ]

  for (const group of groups) {
    const { links, ...groupData } = group
    const created = await prisma.navGroup.create({ data: groupData })
    for (const link of links) {
      await prisma.navLink.create({
        data: { ...link, groupId: created.id, openInNew: false },
      })
    }
    console.log(`  Created group: ${group.label} with ${links.length} links`)
  }

  await prisma.navLink.create({
    data: { label: 'News & Events', url: '/news', sortOrder: 4, openInNew: false, groupId: null },
  })
  console.log('  Created top-level link: News & Events')

  console.log('Navigation seeded successfully.')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
