package models

import (
	"encoding/json"
	"sort"
	"strconv"

	"github.com/pocketbase/dbx"
)

type CourseHoleData struct {
	Number   int `json:"number"`
	Par      int `json:"par"`
	Handicap int `json:"handicap"`
}

type CourseDataHole struct {
	Par      string `json:"par"`
	Handicap string `json:"handicap"`
}

type Course struct {
	Id         string  `db:"id" json:"id"`
	Name       string  `db:"name" json:"name"`
	Slope      int     `db:"slope" json:"slope"`
	CourseRate float64 `db:"course_rate" json:"courseRate"`
	Par        int     `db:"par" json:"par"`
	HoleLayout string  `db:"hole_layout" json:"holeLayout"`
}

type CourseWithHoles struct {
	Course
	Holes []CourseHoleData `json:"holeLayout"`
}

func GetCourseByTournamentId(db dbx.Builder, tournamentId string) (*CourseWithHoles, error) {
	var course Course

	err := db.
		NewQuery(`
			SELECT courses.*
			FROM tournaments
			JOIN courses ON courses.id = tournaments.course_id
			WHERE tournaments.id = {:tournament_id}
		`).
		Bind(dbx.Params{
			"tournament_id": tournamentId,
		}).
		One(&course)

	if err != nil {
		return nil, err
	}

	holes, err := getHolesFromCourseDate(&course)
	if err != nil {
		return nil, err
	}

	return &CourseWithHoles{
		Course: course,
		Holes:  holes,
	}, nil
}

func GetCourseDataFromTournament(db dbx.Builder, tournamentId string) ([]CourseHoleData, error) {
	var course Course

	err := db.
		NewQuery(`
			SELECT courses.hole_layout
			FROM tournaments
			JOIN courses ON courses.id = tournaments.course_id
			WHERE tournaments.id = {:tournament_id}
		`).
		Bind(dbx.Params{
			"tournament_id": tournamentId,
		}).
		One(&course)

	if err != nil {
		return nil, err
	}

	holes, err := getHolesFromCourseDate(&course)
	if err != nil {
		return nil, err
	}

	return holes, nil
}

func getHolesFromCourseDate(course *Course) ([]CourseHoleData, error) {
	var courseLayout map[string]CourseHoleData
	err := json.Unmarshal([]byte(course.HoleLayout), &courseLayout)
	if err != nil {
		return nil, err
	}

	var holes []CourseHoleData
	for holeNumber, hole := range courseLayout {
		number, err := strconv.Atoi(holeNumber)
		if err != nil {
			return nil, err
		}

		hole.Number = number + 1
		holes = append(holes, hole)
	}

	sort.Slice(holes, func(i, j int) bool {
		return holes[i].Number < holes[j].Number
	})

	return holes, nil
}
