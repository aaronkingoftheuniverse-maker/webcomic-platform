import { NextResponse } from 'next/server';
import { prisma } from '@/config/prisma';

export async function GET() {
  try {
    const posts = await prisma.post.findMany({
      include: {
        comic: { select: { title: true, slug: true } },
        images: { select: { filename: true, order: true } },
      },
      orderBy: {
        date: 'desc',
      },
    });

    return NextResponse.json(posts);
  } catch (error) {
    console.error('Error fetching posts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch posts' },
      { status: 500 }
    );
  }
}
