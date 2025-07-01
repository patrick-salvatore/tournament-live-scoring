package controllers

import (
	"net/http"

	"github.com/pocketbase/pocketbase/core"
)

type AuthController struct {
}

type contextKey string

const (
	UserTeamId    contextKey = "teamId"
	UserTourneyId contextKey = "tourneyId"
)

func NewAuthController() *AuthController {
	return &AuthController{}
}

type IndentityData struct {
	TeamId    string `json:"teamId"`
	TourneyId string `json:"tourneyId"`
}

func (a *AuthController) HandleGetIndentity(e *core.RequestEvent) error {
	teamId := e.Request.Context().Value(UserTeamId).(string)
	tourneyId := e.Request.Context().Value(UserTourneyId).(string)

	return e.JSON(http.StatusOK, IndentityData{
		TeamId:    teamId,
		TourneyId: tourneyId,
	})
}
