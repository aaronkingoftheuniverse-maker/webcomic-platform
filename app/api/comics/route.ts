import { NextResponse } from 'next/server';
import { prisma } from '@/config/prisma';

export async function GET() {
  try {
    const comics = await prisma.comic.findMany({
      include: {
        posts: {
          select: {
            id: true,
            title: true,
            slug: true,
            date: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(comics);
  } catch (error) {
    console.error('Error fetching comics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch comics' },
      { status: 500 }
    );
  }
}
