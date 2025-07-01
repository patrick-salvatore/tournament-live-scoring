package models

import (
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

func GetScoreCardWithHolesByPlayerId(db dbx.Builder, tournamentId string, playerId string) (*ScoreCardWithHoles, error) {
	scoreCard := ScoreCard{}

	err := db.
		NewQuery(`
			SELECT 
				id,
				gross_score,
				net_score,
				finished,
				player_id
			FROM score_cards 
			WHERE player_id = {:player_id}
			AND tournament_id = {:tournament_id}
		`).
		Bind(dbx.Params{
			"player_id":     playerId,
			"tournament_id": tournamentId,
		}).
		One(&scoreCard)

	if err != nil {
		return nil, err
	}

	// Then get the holes for the same player and tournament
	var holes []Hole

	err = db.
		NewQuery(`
			SELECT 
				id,
				par,
				handicap,
				number
			FROM holes 
			WHERE player_id = {:player_id} 
			AND tournament_id = {:tournament_id}
			ORDER BY number ASC`).
		Bind(dbx.Params{
			"player_id":     playerId,
			"tournament_id": tournamentId,
		}).
		All(&holes)

	if err != nil {
		return nil, err
	}

	// Combine into the result struct
	result := &ScoreCardWithHoles{
		ScoreCard: scoreCard,
		Holes:     holes,
	}

	return result, nil
}

func GetScoreCardForTeam(db dbx.Builder, teamId string) (*[]ScoreCard, error) {
	var scoreCards []ScoreCard

	err := db.
		NewQuery(`
			SELECT score_cards.*
			FROM score_cards
			JOIN players ON players.id = score_cards.player_id
			WHERE players.team_id = {:team_id}
		`).
		Bind(dbx.Params{
			"team_id": teamId,
		}).
		All(&scoreCards)

	if err != nil {
		return nil, err
	}

	return &scoreCards, nil
}

func CreateScoreCardForPlayer(db dbx.Builder, playerId string, tournamentId string, teamId string) (*ScoreCard, error) {
	var scoreCard ScoreCard

	err := db.
		NewQuery(`
		INSERT INTO score_cards (tournament_id, player_id)
		VALUES ({:tournament_id}, {:player_id})
		RETURNING *
	`).
		Bind(dbx.Params{
			"tournament_id": tournamentId,
			"player_id":     playerId,
			"course_id":     teamId,
		}).
		One(&scoreCard)

	if err != nil {
		return nil, err
	}

	return &scoreCard, nil
}
