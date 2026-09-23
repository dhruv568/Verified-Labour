import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const [
      verifiedWorkersCount,
      completedJobsCount,
      ratingAggregate,
      citiesList,
    ] = await Promise.all([
      prisma.workerProfile.count({
        where: { status: 'VERIFIED' },
      }),
      prisma.job.count({
        where: {
          status: { in: ['COMPLETED', 'PAID', 'REVIEWED'] },
        },
      }),
      prisma.review.aggregate({
        _avg: { rating: true },
        _count: { rating: true },
      }),
      prisma.workerProfile.findMany({
        where: {
          status: 'VERIFIED',
          city: { not: null },
        },
        select: { city: true },
        distinct: ['city'],
      }),
    ]);

    const averageRating = ratingAggregate._avg.rating
      ? Math.round(ratingAggregate._avg.rating * 10) / 10
      : null;
    const reviewCount = ratingAggregate._count.rating || 0;
    const operationalCities = citiesList
      .map((c) => c.city)
      .filter((c): c is string => Boolean(c));

    return NextResponse.json({
      success: true,
      stats: {
        verifiedWorkers: verifiedWorkersCount,
        jobsCompleted: completedJobsCount,
        averageRating,
        reviewCount,
        citiesCovered: operationalCities.length,
        cities: operationalCities,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to retrieve platform stats: ' + err.message,
      },
      { status: 500 }
    );
  }
}
