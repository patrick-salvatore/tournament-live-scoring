package controllers

import (
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/patrick-salvatore/tournament-live-scoring/models"
	"github.com/pocketbase/dbx"
	"github.com/pocketbase/pocketbase/core"
)

type HolesController struct {
	db  dbx.Builder
	app core.App
}

func NewHolesController(app core.App) *HolesController {
	return &HolesController{db: app.DB(), app: app}
}

type UpdateHoleData struct {
	HoleId string `json:"holeId"`
	Score  int    `json:"score"`
}

func (hc *HolesController) HandleUpdateTeamHoleScores(e *core.RequestEvent) error {
	var holesPayload []models.HoleUpdate

	err := json.NewDecoder(e.Request.Body).Decode(&holesPayload)
	if err != nil {
		return e.BadRequestError(err.Error(), nil)
	}

	var updatedHoles []*models.HoleUpdate
	err = hc.app.RunInTransaction(func(txApp core.App) error {
		for _, holeUpdate := range holesPayload {

			updatedHole, err := models.UpdateHoleForPlayer(txApp.DB(), *holeUpdate.Id, holeUpdate)
			if err != nil {
				return fmt.Errorf("failed to update hole %s: %w", *holeUpdate.Id, err)
			}
			updatedHoles = append(updatedHoles, updatedHole)
		}
		return nil
	})

	if err != nil {
		return e.InternalServerError(err.Error(), nil)
	}

	return e.JSON(http.StatusOK, map[string]interface{}{
		"updatedHoles": updatedHoles,
	})

}

func (hc *HolesController) HandleGetHolesForLeaderboard(e *core.RequestEvent) error {
	tournamentId := e.Request.PathValue("tournamentId")

	course, err := models.GetCourseByTournamentId(hc.db, tournamentId)
	if err != nil {
		return e.Error(http.StatusInternalServerError, err.Error(), "GetCourseByTournamentId")
	}

	players, err := models.GetPlayersByTournament(hc.db, tournamentId)
	if err != nil {
		return e.Error(http.StatusInternalServerError, err.Error(), "GetPlayersByTournament")
	}

	var playerMap = make(map[string]models.Player)
	for _, player := range *players {
		playerMap[player.Id] = player
	}

	holes, err := models.GetHolesForLeaderboard(hc.db, tournamentId)
	if err != nil {
		return e.Error(http.StatusInternalServerError, err.Error(), "GetHolesForLeaderboard")
	}

	for index, hole := range *holes {
		playerTee := playerMap[hole.PlayerId].Tee
		holeIndex := (course.Meta.Holes)[hole.Number-1].Handicap
		courseTeeData := course.Meta.Tees[playerTee]

		hole.StrokeHole = getStrokeHole(hole.PlayerHandicap, float64(courseTeeData.SlopeRating), courseTeeData.CourseRating, float64(courseTeeData.Par), hole.AwardedTournamentHandicap, holeIndex)

		(*holes)[index] = hole
	}

	return e.JSON(http.StatusOK, holes)

}
