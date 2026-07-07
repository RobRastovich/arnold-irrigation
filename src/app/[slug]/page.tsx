import { notFound } from 'next/navigation'
import { PrismaClient } from '@prisma/client'
import type { Metadata } from 'next'

const prisma = new PrismaClient()

interface Props {
  params: { slug: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const page = await prisma.cmsPage.findFirst({
    where: { slug: params.slug, status: 'PUBLISHED' },
    select: { title: true, metaTitle: true, metaDesc: true },
  })

  if (!page) return {}

  return {
    title: page.metaTitle || page.title,
    description: page.metaDesc || undefined,
  }
}

export default async function PublicCmsPage({ params }: Props) {
  const page = await prisma.cmsPage.findFirst({
    where: { slug: params.slug, status: 'PUBLISHED' },
  })

  if (!page) notFound()

  return (
    <div className="py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <article>
          <header className="mb-8 pb-6 border-b border-gray-200">
            <h1 className="text-4xl font-bold text-primary-900">{page.title}</h1>
            <p className="text-sm text-gray-500 mt-2">
              Last updated {new Date(page.updatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </header>

          <div
            className="prose prose-lg max-w-none prose-headings:text-primary-900 prose-a:text-primary-600 prose-img:rounded-lg prose-img:shadow-md"
            dangerouslySetInnerHTML={{ __html: page.content }}
          />
        </article>
      </div>
    </div>
  )
}
