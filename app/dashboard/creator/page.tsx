// app/dashboard/creator/page.tsx
import { requireRole } from "@/lib/auth";
import { ROLES } from "@/lib/roles";
import CreateProfilePrompt from "./CreateProfilePrompt";
import FullCreatorDashboard from "./FullCreatorDashboard";

export default async function CreatorDashboardPage() {
  // USER or ADMIN are allowed here
  const session = await requireRole([ROLES.USER, ROLES.ADMIN]);

  const { hasCreatorProfile, username } = session.user;

  if (!hasCreatorProfile) {
    return <CreateProfilePrompt username={username} />;
  }

  return <FullCreatorDashboard session={session} />;
}
