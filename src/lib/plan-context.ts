import { cookies } from 'next/headers';
import { db } from '@/db';
import { plans } from '@/db/schema';
import { eq, isNull } from 'drizzle-orm';

/**
 * Get the active plan ID from cookie or default plan
 * Used in API routes to scope data to the active plan
 */
export async function getActivePlanId(): Promise<string> {
  const cookieStore = await cookies();
  const planIdFromCookie = cookieStore.get('planId')?.value;

  if (planIdFromCookie) {
    return planIdFromCookie;
  }

  // Fetch default plan
  const [defaultPlan] = await db
    .select({ id: plans.id })
    .from(plans)
    .where(eq(plans.isDefault, true))
    .limit(1);

  if (defaultPlan) {
    return defaultPlan.id;
  }

  throw new Error('No plan found. Please create a plan first.');
}
