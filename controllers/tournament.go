package controllers

import (
	"net/http"
	"sort"
	"strconv"

	"github.com/patrick-salvatore/tournament-live-scoring/models"
	"github.com/pocketbase/dbx"
	"github.com/pocketbase/pocketbase/core"
)

type TournamentController struct {
	app core.App
	db  dbx.Builder
}

func NewTournamentController(app core.App) *TournamentController {
	return &TournamentController{app: app, db: app.DB()}
}

func (tc *TournamentController) HandleGetTournamentById(e *core.RequestEvent) error {
	tournamentId := e.Request.PathValue("tournamentId")
	tournament, err := models.GetTournamentById(tc.app.DB(), tournamentId)

	if err != nil {
		return e.Error(http.StatusInternalServerError, err.Error(), nil)
	}

	return e.JSON(http.StatusOK, tournament)
}

func (tc *TournamentController) HandleGetTeamsByTournamentId(e *core.RequestEvent) error {
	tournamentId := e.Request.PathValue("tournamentId")
	teams, err := models.GetTeamsByTournamentId(tc.db, tournamentId)

	if err != nil {
		return e.Error(http.StatusInternalServerError, err.Error(), nil)
	}

	return e.JSON(http.StatusOK, teams)
}

func (tc *TournamentController) HandleStartTournamentForTeam(e *core.RequestEvent) error {
	tournamentId := e.Request.PathValue("tournamentId")
	teamId := e.Request.PathValue("teamId")

	course, err := models.GetCourseByTournamentId(tc.db, tournamentId)
	if err != nil {
		return err
	}

	players, err := models.GetPlayersFromTeamId(tc.db, teamId)
	if err != nil {
		return e.Error(http.StatusInternalServerError, err.Error(), nil)
	}

	if len(*players) == 0 {
		return e.Error(http.StatusInternalServerError, err.Error(), nil)
	}

	err = tc.app.RunInTransaction(func(txApp core.App) error {
		for _, player := range *players {
			_, err = models.CreateAllHolesForPlayer(txApp.DB(), player.Id, tournamentId, course.Holes)
			if err != nil {
				return err
			}

			started := true
			_, err = models.UpdateTeam(txApp.DB(), teamId, models.TeamUpdate{Started: &started})
			if err != nil {
				return err
			}
		}

		return nil
	})

	if err != nil {
		return e.Error(http.StatusInternalServerError, err.Error(), nil)
	}

	return e.JSON(http.StatusCreated, "OK")
}

type LeaderboardRow struct {
	TeamId   string `json:"teamId"`
	TeamName string `json:"teamName"`
	Gross    int    `json:"grossScore"`
	Net      int    `json:"netScore"`
	Thru     int    `json:"thru"`
}

func (tc *TournamentController) HandleGetLeaderboard(e *core.RequestEvent) error {
	tournamentId := e.Request.PathValue("tournamentId")

	holes, err := models.GetHolesForLeaderboard(tc.db, tournamentId)
	if err != nil {
		return e.Error(http.StatusInternalServerError, err.Error(), nil)
	}

	courseData, err := models.GetCourseByTournamentId(tc.db, tournamentId)
	if err != nil {
		return err
	}

	courseHoleMap := getHoleDataMap(courseData)

	for index, hole := range *holes {
		holeIndex := (courseHoleMap)[hole.Number].Handicap

		hole.StrokeHole = getStrokeHole(hole.PlayerHandicap, courseData.Slope, hole.AwardedTournamentHandicap, holeIndex)
		(*holes)[index] = hole

	}

	holesByTeamAndPlayer := groupHolesByTeamAndPlayer(*holes)
	leaderboardRows := []LeaderboardRow{}

	for teamId, teamHolesMap := range holesByTeamAndPlayer {
		leaderboardRow := LeaderboardRow{}
		players := map[string]bool{}

		leaderboardRow.TeamId = teamId

		thruCount := 0
		for _, teamScoreOnHole := range teamHolesMap {
			if len(teamScoreOnHole) == 0 {
				break
			}

			var holePar int
			var netScore int
			var grossScore int

			for _, hole := range teamScoreOnHole {
				players[hole.PlayerName] = true

				if len(hole.Score) > 0 && hole.Score != "X" {
					holeScore, _ := strconv.Atoi(hole.Score)

					if holeScore <= grossScore || grossScore == 0 {
						netScore = holeScore
						grossScore = holeScore

						if hole.StrokeHole {
							netScore = holeScore - 1
						}
					}
					holePar = hole.Par
				}
			}

			if netScore > 0 || grossScore > 0 {
				thruCount++
			}

			leaderboardRow.Thru = thruCount
			leaderboardRow.Gross -= holePar - grossScore
			leaderboardRow.Net -= holePar - netScore
		}

		names := []string{}
		for name := range players {
			names = append(names, name)
		}
		leaderboardRow.TeamName = joinNames(names)

		leaderboardRows = append(leaderboardRows, leaderboardRow)
	}

	sort.Slice(leaderboardRows, func(i, j int) bool {
		return leaderboardRows[j].Net > leaderboardRows[i].Net
	})
	return e.JSON(http.StatusOK, leaderboardRows)
}
