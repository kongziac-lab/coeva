import { eq } from "drizzle-orm";
import { instructors } from "@/db/schema";
import { getDb } from "@/lib/db";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const [instructor] = await getDb().select({ photoData: instructors.photoData }).from(instructors).where(eq(instructors.id, id)).limit(1);
    const match = instructor?.photoData?.match(/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/);
    if (!match) return new Response(null, { status: 404 });
    return new Response(Buffer.from(match[2], "base64"), { headers: { "content-type": match[1], "cache-control": "public, max-age=86400, stale-while-revalidate=604800", "x-content-type-options": "nosniff" } });
  } catch {
    return new Response(null, { status: 503 });
  }
}
