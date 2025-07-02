package controllers

import (
	"math"
	"sort"
	"strings"

	"github.com/patrick-salvatore/tournament-live-scoring/models"
)

func getStrokeHole(playerHandicap, slope, awardedHandicap float64, holeHandicap int) bool {
	roundedHandicap := math.RoundToEven(playerHandicap)
	courseHandicap := int(math.Round(((roundedHandicap * slope) / 113.0) * awardedHandicap))
	return courseHandicap >= holeHandicap
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

func getHoleDataMap(course *models.CourseWithHoles) models.CourseHoleDataMap {
	courseHoleMap := make(models.CourseHoleDataMap)
	for _, hole := range course.Holes {
		courseHoleMap[hole.Number] = hole
	}

	return courseHoleMap
}
