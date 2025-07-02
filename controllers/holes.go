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
