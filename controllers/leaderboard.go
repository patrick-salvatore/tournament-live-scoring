package controllers

import (
	"math"
	"net/http"
	"sort"
	"strconv"
	"strings"

	"github.com/patrick-salvatore/tournament-live-scoring/models"
	"github.com/pocketbase/dbx"
	"github.com/pocketbase/pocketbase/core"
)

type LeaderboardController struct {
	app core.App
	db  dbx.Builder
}

func NewLeaderboardController(app core.App) *LeaderboardController {
	return &LeaderboardController{app: app, db: app.DB()}
}

func getStrokeHole(playerHandicap, slope, awardedHandicap float64, holeHandicap int) bool {
	roundedHandicap := math.RoundToEven(playerHandicap)
	courseHandicap := int(math.Round(((roundedHandicap * slope) / 113.0) * awardedHandicap))
	return courseHandicap >= holeHandicap
}

type LeaderboardRow struct {
	TeamId   string `json:"teamId"`
	TeamName string `json:"teamName"`
	Gross    int    `json:"grossScore"`
	Net      int    `json:"netScore"`
	Thru     int    `json:"thru"`
}

func (lc *LeaderboardController) HandleGetLeaderboard(e *core.RequestEvent) error {
	tournamentId := e.Request.PathValue("tournamentId")

	holes, err := models.GetHolesWithAScoreForTournamentId(lc.db, tournamentId)
	if err != nil {
		return e.Error(http.StatusInternalServerError, err.Error(), nil)
	}

	courseData, err := models.GetCourseByTournamentId(lc.db, tournamentId)
	if err != nil {
		return err
	}

	courseHoleMap := make(models.CourseHoleDataMap)
	for _, hole := range courseData.Holes {
		courseHoleMap[hole.Number] = hole
	}

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

func joinNames(names []string) string {
	sort.Strings(names)
	return strings.Join(names, ", ")
}

func groupHolesByTeamAndPlayer(holes []models.HoleWithMetadata) map[string]map[int][]models.HoleWithMetadata {
	result := make(map[string]map[int][]models.HoleWithMetadata)

	for _, hole := range holes {
		teamID := hole.TeamId
		holeNumber := hole.Number

		if _, ok := result[teamID]; !ok {
			result[teamID] = make(map[int][]models.HoleWithMetadata)
		}
		result[teamID][holeNumber] = append(result[teamID][holeNumber], hole)
	}

	return result
}
