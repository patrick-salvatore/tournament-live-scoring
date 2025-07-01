package models

import (
	"github.com/pocketbase/dbx"
)

type Player struct {
	Id       string  `db:"id" json:"id"`
	Name     string  `db:"name" json:"name"`
	Handicap float64 `db:"handicap" json:"handicap"`
	TeamId   string  `db:"team_id" json:"teamId"`
}

func GetPlayers(db dbx.Builder) (*[]Player, error) {
	players := []Player{}

	err := db.
		NewQuery("SELECT * FROM players").
		All(&players)

	if err != nil {
		return nil, err
	}

	return &players, nil
}

func GetPlayersFromTeamId(db dbx.Builder, teamId string) (*[]Player, error) {
	players := []Player{}

	err := db.
		NewQuery("SELECT * FROM players WHERE team_id = {:team_id}").
		Bind(dbx.Params{
			"team_id": teamId,
		}).
		All(&players)

	if err != nil {
		return nil, err
	}

	return &players, nil
}
