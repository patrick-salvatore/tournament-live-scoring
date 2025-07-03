package models

import (
	"github.com/pocketbase/dbx"
)

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
