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
	teamId := e.Request.PathValue("teamId")
	team, err := models.GetTeamById(tc.db, teamId)

	if err != nil {
		return e.Error(http.StatusInternalServerError, err.Error(), nil)
	}

	return e.JSON(http.StatusOK, team)
}

type TeamAssignment struct {
	Token        string `json:"token"`
	TeamId       string `json:"teamId"`
	TournamentId string `json:"tournamentId"`
}

func (tc *TeamsController) HandleAssignPlayerTeam(e *core.RequestEvent) error {
	teamId := e.Request.PathValue("teamId")

	team, err := models.GetTeamById(tc.db, teamId)
	if err != nil {
		return e.NotFoundError(err.Error(), teamId)
	}

	if team.Finished {
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

	return e.JSON(http.StatusOK, TeamAssignment{
		Token:        jwt,
		TeamId:       team.Id,
		TournamentId: team.TournamentId,
	})
}

func (tc *TeamsController) HandleGetTeamHoles(e *core.RequestEvent) error {
	teamId := e.Request.PathValue("teamId")

	team, err := models.GetTeamById(tc.db, teamId)
	if err != nil {
		return e.Error(http.StatusInternalServerError, err.Error(), nil)
	}

	course, err := models.GetCourseByTournamentId(tc.db, team.TournamentId)
	if err != nil {
		return err
	}
	courseHoleMap := getHoleDataMap(course)

	holes, err := models.GetHolesForTeam(tc.db, teamId, team.TournamentId)
	if err != nil {
		return e.Error(http.StatusInternalServerError, err.Error(), nil)
	}

	holesWithStrokeHole := []models.Hole{}
	for _, hole := range *holes {
		holeIndex := (courseHoleMap)[hole.Number].Handicap

		hole.StrokeHole = getStrokeHole(hole.PlayerHandicap, course.Slope, course.CourseRate, float64(course.Par), hole.AwardedTournamentHandicap, holeIndex)

		holesWithStrokeHole = append(holesWithStrokeHole, hole)
	}

	return e.JSON(http.StatusOK, holesWithStrokeHole)
}

func (tc *TeamsController) HandleGetTeamPlayers(e *core.RequestEvent) error {
	teamId := e.Request.PathValue("teamId")
	players, err := models.GetPlayersFromTeamId(tc.db, teamId)

	if err != nil {
		return e.Error(http.StatusInternalServerError, err.Error(), nil)
	}

	return e.JSON(http.StatusOK, players)
}

func (tc *TeamsController) HandleGetTeamHolesCount(e *core.RequestEvent) error {
	teamId := e.Request.PathValue("teamId")

	team, err := models.GetTeamById(tc.db, teamId)
	if err != nil {
		return e.Error(http.StatusInternalServerError, err.Error(), nil)
	}

	count, err := models.GetHolesCountForTeam(tc.db, teamId, team.TournamentId)
	if err != nil {
		return e.Error(http.StatusInternalServerError, err.Error(), nil)
	}

	return e.JSON(http.StatusOK, count)
}
