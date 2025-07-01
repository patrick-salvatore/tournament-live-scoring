package controllers

import (
	"net/http"

	"github.com/patrick-salvatore/tournament-live-scoring/models"
	"github.com/pocketbase/dbx"
	"github.com/pocketbase/pocketbase/core"
)

type PlayersController struct {
	db dbx.Builder
}

func NewPlayersController(app core.App) *PlayersController {
	return &PlayersController{db: app.DB()}
}

func (pc *PlayersController) HandleGetAllPlayers(e *core.RequestEvent) error {
	players, err := models.GetPlayers(pc.db)

	if err != nil {
		return e.Error(http.StatusInternalServerError, err.Error(), nil)
	}

	return e.JSON(http.StatusOK, players)
}

func (pc *PlayersController) HandleGetPlayersFromTeamId(e *core.RequestEvent) error {
	teamId := e.Request.PathValue("teamId")
	players, err := models.GetPlayersFromTeamId(pc.db, teamId)

	if err != nil {
		return e.Error(http.StatusInternalServerError, err.Error(), nil)
	}

	return e.JSON(http.StatusOK, players)
}
