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
		panic(err)
	}

	app := pocketbase.New()

	app.OnServe().BindFunc(func(se *core.ServeEvent) error {
		router := se.Router.Group("/")

		router.GET("v1/heathz", controllers.HandleHealthzRequest)

		teamsCtr := controllers.NewTeamsController(app)
		router.POST("v1/team/_assign", teamsCtr.HandleAssignPlayerTeam).
			BindFunc(func(e *core.RequestEvent) error {
				unescaped := e.Request.PathValue("uuid")
				escaped := html.EscapeString(unescaped)
				e.Request.SetPathValue("uuid", escaped)

				return e.Next()
			})

		protectedRouter := se.Router.Group("/").BindFunc(middleware.WithJWTVerify(app))

		playerCtr := controllers.NewPlayersController(app)
		protectedRouter.GET("v1/players", playerCtr.HandleGetAllPlayers)
		protectedRouter.GET("v1/team/players/{teamId}", playerCtr.HandleGetPlayersFromTeamId)

		authCtr := controllers.NewAuthController()
		protectedRouter.GET("v1/identity", authCtr.HandleGetIndentity)

		tournamentCtr := controllers.NewTournamentController(app)
		protectedRouter.GET("v1/tournament/{id}", tournamentCtr.HandleGetTournamentById)

		protectedRouter.GET("v1/team/{id}", teamsCtr.HandleGetTeamById)

		scordCardCtr := controllers.NewScoreCardController(app)
		protectedRouter.POST("v1/score_cards", scordCardCtr.HandleCreateScoreCardsForTeam)
		protectedRouter.GET("v1/score_cards/{tournamentId}/{teamId}", scordCardCtr.HandleGetScoreCardsForTeam)

		courseCtr := controllers.NewCourseController(app)
		protectedRouter.GET("v1/course/{tournamentId}", courseCtr.HandleGetCourseByTournamentId)

		holesCtr := controllers.NewHolesController(app)
		protectedRouter.GET("v1/holes/{teamId}/{tournamentId}", holesCtr.HandleGetAllTournamentHolesForTeam)
		protectedRouter.PUT("v1/holes", holesCtr.HandleUpdateTeamHoleScores)

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
