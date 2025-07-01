package models

import "github.com/pocketbase/dbx"

type Tournament struct {
	Id              string  `db:"id" json:"id"`
	Name            string  `db:"name" json:"name"`
	Uuid            string  `db:"uuid" json:"uuid"`
	CourseId        string  `db:"course_id" json:"courseId"`
	AwardedHandicap float64 `db:"awarded_handicap" json:"awardedHandicap"`
	IsComplete      bool    `db:"complete" json:"complete"`
}

func GetTournamentById(db dbx.Builder, id string) (*Tournament, error) {
	tournament := Tournament{}

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

func GetTournamentByUuid(db dbx.Builder, uuid string) (*Tournament, error) {
	tournament := Tournament{}

	err := db.
		NewQuery("SELECT * FROM tournaments WHERE uuid LIKE {:uuid}").
		Bind(dbx.Params{
			"uuid": uuid,
		}).
		One(&tournament)

	if err != nil {
		return nil, err
	}

	return &tournament, nil
}

type TournamentWithFormat struct {
	Id         string `db:"id" json:"id"`
	Name       string `db:"name" json:"name"`
	Uuid       string `db:"uuid" json:"uuid"`
	FormatId   string `db:"format_id" json:"formatId"`
	FormatName string `db:"format_name" json:"formatName"`
	CourseId   string `db:"course_id" json:"courseId"`
	IsComplete bool   `db:"complete" json:"complete"`
}
