package main

import (
	"html"
	"log"

	"github.com/joho/godotenv"
	"github.com/patrick-salvatore/tournament-live-scoring/controllers"
	"github.com/patrick-salvatore/tournament-live-scoring/middleware"
	"github.com/patrick-salvatore/tournament-live-scoring/ui"
	"github.com/pocketbase/pocketbase"
	"github.com/pocketbase/pocketbase/apis"
	"github.com/pocketbase/pocketbase/core"
)

func main() {
	if err := godotenv.Load(); err != nil {
	}

	app := pocketbase.New()

	app.OnServe().BindFunc(func(se *core.ServeEvent) error {
		router := se.Router.Group("/")
		protectedRouter := se.Router.Group("/").BindFunc(middleware.WithJWTVerify(app))

		router.GET("v1/heathz", controllers.HandleHealthzRequest)

		// /auth
		authCtr := controllers.NewAuthController()
		protectedRouter.GET("v1/identity", authCtr.HandleGetIndentity)

		// /team
		teamsCtr := controllers.NewTeamsController(app)
		router.POST("v1/team/{teamId}/assign", teamsCtr.HandleAssignPlayerTeam).
			BindFunc(func(e *core.RequestEvent) error {
				unescaped := e.Request.PathValue("uuid")
				escaped := html.EscapeString(unescaped)
				e.Request.SetPathValue("uuid", escaped)

				return e.Next()
			})
		protectedRouter.GET("v1/team/{teamId}", teamsCtr.HandleGetTeamById)
		protectedRouter.GET("v1/team/{teamId}/holes", teamsCtr.HandleGetTeamHoles)
		protectedRouter.GET("v1/team/{teamId}/players", teamsCtr.HandleGetTeamPlayers)

		// /tournament
		tournamentCtr := controllers.NewTournamentController(app)
		protectedRouter.GET("v1/tournament/{tournamentId}", tournamentCtr.HandleGetTournamentById)
		protectedRouter.GET("v1/tournament/{tournamentId}/teams", tournamentCtr.HandleGetTeamsByTournamentId)
		protectedRouter.POST("v1/tournament/{tournamentId}/team/{teamId}/start", tournamentCtr.HandleStartTournamentForTeam)
		protectedRouter.GET("v1/tournament/{tournamentId}/leaderboard", tournamentCtr.HandleGetLeaderboard)

		// /course
		courseCtr := controllers.NewCourseController(app)
		protectedRouter.GET("v1/course/{tournamentId}", courseCtr.HandleGetCourseByTournamentId)

		// /holes
		holesCtr := controllers.NewHolesController(app)
		protectedRouter.PATCH("v1/holes", holesCtr.HandleUpdateTeamHoleScores)

		// APP
		se.Router.GET("/{path...}", apis.Static(ui.DistDirFS, true)).
			BindFunc(func(e *core.RequestEvent) error {
				if e.Request.PathValue(apis.StaticWildcardParam) != "" {
					e.Response.Header().Set("Cache-Control", "max-age=1209600, stale-while-revalide=86400")
				}
				return e.Next()
			}).
			Bind(apis.Gzip())

		return se.Next()
	})

	if err := app.Start(); err != nil {
		log.Fatal(err)
	}
}
