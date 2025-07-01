import { useLocation, useNavigate } from "@solidjs/router";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { createMemo, Suspense, type ParentComponent } from "solid-js";
import { useTeamStore } from "~/state/team";
import { identity } from "~/state/helpers";

const TournamentView: ParentComponent = (props) => {
  const navigate = useNavigate();
  const location = useLocation();
  const teamId = useTeamStore(identity);

  const currentTab = createMemo(() => {
    if (location.pathname.endsWith("scoreCard")) return "scoreCard";
    if (location.pathname.endsWith("leaderBoard")) return "leaderBoard";
  });

  const handleTabChange = (value: string) => {
    if (value === "scoreCard") {
      navigate(`/tournament/${teamId.id}/scoreCard`);
    } else {
      navigate(`/tournament/leaderBoard`);
    }
  };

  return (
    <Tabs value={currentTab()} onChange={handleTabChange}>
      <TabsList>
        <TabsTrigger class="z-5" value="scoreCard">
          Score Card
        </TabsTrigger>
        <TabsTrigger class="z-5" value="leaderBoard">
          Leaderboard
        </TabsTrigger>
      </TabsList>

      <Suspense>
        <TabsContent value="leaderBoard">{props.children}</TabsContent>
      </Suspense>
      <TabsContent value="scoreCard">{props.children}</TabsContent>
    </Tabs>
  );
};

export default TournamentView;
