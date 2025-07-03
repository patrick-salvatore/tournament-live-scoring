import { useLocation, useNavigate } from "@solidjs/router";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { createMemo, Show, Suspense, type ParentComponent } from "solid-js";
import { useTeamStore } from "~/state/team";
import { identity } from "~/state/helpers";
import { useSessionStore } from "~/state/session";

const TournamentView: ParentComponent = (props) => {
  const navigate = useNavigate();
  const location = useLocation();
  const session = useSessionStore(identity);
  const team = useTeamStore(identity);

  const currentTab = createMemo(() => {
    if (location.pathname.endsWith("scorecard")) return "scorecard";
    if (location.pathname.endsWith("leaderboard")) return "leaderboard";
  });

  const handleTabChange = (value: string) => {
    if (value === "scorecard") {
      navigate(`/tournament/scorecard`);
    } else {
      navigate(`/tournament/leaderboard`);
    }
  };

  return (
    <Show when={session()}>
      <Tabs value={currentTab()} onChange={handleTabChange}>
        <TabsList>
          <TabsTrigger class="z-5" value="scorecard">
            Score Card
          </TabsTrigger>
          <TabsTrigger class="z-5" value="leaderboard">
            Leaderboard
          </TabsTrigger>
        </TabsList>

        <Suspense>
          <TabsContent value="leaderboard">{props.children}</TabsContent>
          <TabsContent value="scorecard">{props.children}</TabsContent>
        </Suspense>
      </Tabs>
    </Show>
  );
};

export default TournamentView;
