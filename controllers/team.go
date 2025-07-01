package controllers

import (
	"net/http"

	"github.com/patrick-salvatore/tournament-live-scoring/models"
	"github.com/pocketbase/dbx"
	"github.com/pocketbase/pocketbase/core"
)

type TeamsController struct {
	app core.App
	db  dbx.Builder
}

func NewTeamsController(app core.App) *TeamsController {
	return &TeamsController{app: app, db: app.DB()}
}

func (tc *TeamsController) HandleGetTeamById(e *core.RequestEvent) error {
	id := e.Request.PathValue("id")
	players, err := models.GetTeamById(tc.db, id)

	if err != nil {
		return e.Error(http.StatusInternalServerError, err.Error(), nil)
	}

	return e.JSON(http.StatusOK, players)
}

func (tc *TeamsController) HandleAssignPlayerTeam(e *core.RequestEvent) error {
	info, err := e.RequestInfo()
	if err != nil {
		return e.BadRequestError(err.Error(), nil)
	}

	teamId, ok := info.Body["teamId"].(string)
	if !ok || teamId == "" {
		return e.BadRequestError("Invalid or missing teamId", nil)
	}

	team, err := models.GetTeamByIdWithTournamentData(tc.db, teamId)
	if err != nil {
		return e.NotFoundError(err.Error(), teamId)
	}

	if team.TournamentComplete {
		return e.InternalServerError("unable to join this team", err)
	}

	tokenData := map[string]any{
		"teamId":       team.Id,
		"tournamentId": team.TournamentId,
	}
	jwt, err := models.NewAuthToken(tokenData)
	if err != nil {
		return e.InternalServerError("Failed to create session JWT", err)
	}

	// err = tc.app.RunInTransaction(func(txApp core.App) error {
	// 	players, err := models.GetPlayersFromTeamId(tc.db, teamId)

	// 	if err != nil {
	// 		return err
	// 	}

	// 	for _, player := range *players {
	// 		_, err := txApp.DB().Insert(
	// 			"score_cards",
	// 			dbx.Params{
	// 				"tournament_id": team.TournamentId,
	// 				"player_id":     player.Id,
	// 				"course_id":     team.TournamentComplete,
	// 			}).
	// 			Execute()

	// 		if err != nil {
	// 			return err
	// 		}
	// 	}

	// 	return nil
	// })

	if err != nil {
		return e.InternalServerError("Failed to create session JWT", err)
	}

	return e.JSON(http.StatusOK, map[string]string{"token": jwt})
}
