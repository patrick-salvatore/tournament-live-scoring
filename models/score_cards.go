package models

import (
	"time"

	"github.com/pocketbase/dbx"
)

type ScoreCard struct {
	Id           string  `db:"id" json:"id"`
	PlayerId     string  `db:"player_id" json:"playerId"`
	TournamentId string  `db:"tournament_id" json:"tournamentId"`
	Finished     bool    `db:"finished" json:"finished"`
	GrossScore   float64 `db:"gross_score" json:"grossScore"`
	NetScore     float64 `db:"net_score" json:"netScore"`
}

type ScoreCardWithHoles struct {
	ScoreCard
	Holes []Hole `json:"holes"`
}

func GetPlayerScoreCard(db dbx.Builder, playerId string) (*ScoreCard, error) {
	scoreCard := ScoreCard{}

	err := db.
		NewQuery("SELECT * FROM score_cards card WHERE card.player_id = {:player_id}").
		Bind(dbx.Params{
			"player_id": playerId,
		}).
		One(&scoreCard)

	if err != nil {
		return nil, err
	}

	return &scoreCard, nil
}

func CreateScoreCardForPlayer(db dbx.Builder, playerId string, tournamentId string, teamId string) (*ScoreCard, error) {
	var scoreCard ScoreCard

	err := db.
		NewQuery(`
		INSERT INTO score_cards (tournament_id, player_id, created, updated)
		VALUES ({:tournament_id}, {:player_id}, {:created}, {:updated})
		RETURNING *
	`).
		Bind(dbx.Params{
			"tournament_id": tournamentId,
			"player_id":     playerId,
			"course_id":     teamId,
			"created":       time.Now().Format(time.RFC3339),
			"updated":       time.Now().Format(time.RFC3339),
		}).
		One(&scoreCard)

	if err != nil {
		return nil, err
	}

	return &scoreCard, nil
}
