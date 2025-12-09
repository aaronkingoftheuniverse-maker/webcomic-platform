import { CreatorInfoCard } from "@/components/creator/CreatorInfoCard";
import { CreatorTabs } from "@/components/comics/CreatorTabs";
import { getCreatorPageData } from "@/lib/data/creators";

interface CreatorLayoutProps {
  children: React.ReactNode;
  params: { username: string };
}

export default async function CreatorLayout({
  children,
  params: paramsProp,
}: CreatorLayoutProps) {
  const params = await paramsProp;
  const creator = await getCreatorPageData(params.username);

  return (
    <div className="container mx-auto">
      {/* Creator Tabs now at the top, spanning the full width */}
      <div className="mb-8">
        <CreatorTabs username={creator.user.username} avatarUrl={creator.avatarUrl} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Main Content Area (list of comics) */}
        <main className="lg:col-span-3">{children}</main>

        {/* Right Sidebar */}
        <aside className="lg:col-span-1">
          <CreatorInfoCard
            username={creator.user.username}
            avatarUrl={creator.avatarUrl}
            bio={creator.bio}
            website={creator.website}
          />
        </aside>
      </div>
    </div>
  );
}