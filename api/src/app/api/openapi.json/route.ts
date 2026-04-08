import { NextRequest, NextResponse } from 'next/server';
import { createOpenApiSpec } from '@/lib/openapi';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  return NextResponse.json(createOpenApiSpec(request.nextUrl.origin));
}
