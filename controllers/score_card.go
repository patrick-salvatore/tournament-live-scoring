package controllers

import (
	"net/http"

	"github.com/patrick-salvatore/tournament-live-scoring/models"
	"github.com/pocketbase/dbx"
	"github.com/pocketbase/pocketbase/core"
)

type ScoreCardController struct {
	db  dbx.Builder
	app core.App
}

func NewScoreCardController(app core.App) *ScoreCardController {
	return &ScoreCardController{db: app.DB(), app: app}
}

func (sc *ScoreCardController) HandleGetScoreCardsForTeam(e *core.RequestEvent) error {
	teamId := e.Request.PathValue("teamId")

	players, err := models.GetPlayersFromTeamId(sc.db, teamId)
	if err != nil {
		return e.NotFoundError("players found", teamId)
	}

	var scoreCardsWithHoles []models.ScoreCard
	for _, player := range *players {
		scoreCard, err := models.GetPlayerScoreCard(sc.db, player.Id)
		if err != nil {
			return e.NotFoundError("No scorecards found for player", player.Id)
		}

		scoreCardsWithHoles = append(scoreCardsWithHoles, *scoreCard)
	}

	return e.JSON(http.StatusCreated, scoreCardsWithHoles)
}

func (sc *ScoreCardController) HandleCreateScoreCardsForTeam(e *core.RequestEvent) error {
	info, err := e.RequestInfo()
	if err != nil {
		return e.BadRequestError(err.Error(), nil)
	}

	teamId, ok := info.Body["teamId"].(string)
	if !ok || teamId == "" {
		return e.BadRequestError("Invalid or missing teamId", nil)
	}

	tournamentId, ok := info.Body["tournamentId"].(string)
	if !ok || tournamentId == "" {
		return e.BadRequestError("Invalid or missing teamId", nil)
	}

	players, err := models.GetPlayersFromTeamId(sc.db, teamId)
	if err != nil {
		return e.Error(http.StatusInternalServerError, err.Error(), nil)
	}

	scoreCards := []*models.ScoreCardWithHoles{}
	err = sc.app.RunInTransaction(func(txApp core.App) error {
		for _, player := range *players {
			courseData, err := models.GetCourseDataFromTournament(txApp.DB(), tournamentId)
			if err != nil {
				return err
			}

			scoreCard, err := models.CreateScoreCardForPlayer(txApp.DB(), player.Id, tournamentId, teamId)
			if err != nil {
				return err
			}

			holes, err := models.CreateAllHolesForPlayer(txApp.DB(), player.Id, tournamentId, courseData)
			if err != nil {
				return err
			}

			scoreCards = append(scoreCards, &models.ScoreCardWithHoles{
				ScoreCard: *scoreCard,
				Holes:     *holes,
			})
		}

		return nil
	})

	if err != nil {
		return e.Error(http.StatusInternalServerError, err.Error(), nil)
	}

	return e.JSON(http.StatusCreated, scoreCards)
}
