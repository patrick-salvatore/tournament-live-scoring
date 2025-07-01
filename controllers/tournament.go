package controllers

import (
	"net/http"

	"github.com/patrick-salvatore/tournament-live-scoring/models"
	"github.com/pocketbase/pocketbase/core"
)

type TournamentController struct {
	app core.App
}

func NewTournamentController(app core.App) *TournamentController {
	return &TournamentController{app: app}
}

func (tc *TournamentController) HandleGetTournamentById(e *core.RequestEvent) error {
	id := e.Request.PathValue("id")
	tournament, err := models.GetTournamentById(tc.app.DB(), id)

	if err != nil {
		return e.Error(http.StatusInternalServerError, err.Error(), nil)
	}

	return e.JSON(http.StatusOK, tournament)
}
