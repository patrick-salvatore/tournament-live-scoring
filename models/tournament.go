package models

import "github.com/pocketbase/dbx"

type Tournament struct {
	Id              string  `db:"id" json:"id"`
	Name            string  `db:"name" json:"name"`
	CourseId        string  `db:"course_id" json:"courseId"`
	TeamCount       float64 `db:"team_count" json:"teamCount"`
	HoleCount       float64 `db:"hole_count" json:"holeCount"`
	AwardedHandicap float64 `db:"awarded_handicap" json:"awardedHandicap"`
	IsComplete      bool    `db:"complete" json:"complete"`
}

func GetTournamentById(db dbx.Builder, id string) (*Tournament, error) {
	var tournament Tournament

	err := db.
		NewQuery("SELECT * FROM tournaments WHERE id = {:id}").
		Bind(dbx.Params{
			"id": id,
		}).
		One(&tournament)

	if err != nil {
		return nil, err
	}

	return &tournament, nil
}
