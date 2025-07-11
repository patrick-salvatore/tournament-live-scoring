package models

import (
	"fmt"
	"strings"
	"time"

	"github.com/pocketbase/dbx"
)

type Hole struct {
	Id       string `db:"id" json:"id"`
	Score    string `db:"score" json:"score"`
	Par      int    `db:"par" json:"par"`
	Handicap int    `db:"handicap" json:"handicap"`
	Number   int    `db:"number" json:"number"`
	PlayerId string `db:"player_id" json:"playerId"`

	PlayerHandicap            float64 `db:"player_handicap" json:"-"`
	AwardedTournamentHandicap float64 `db:"awarded_handicap" json:"-"`
	StrokeHole                int     `json:"strokeHole"`
}

func GetPlayerHole(db dbx.Builder, holeId string) (*Hole, error) {
	var hole Hole

	err := db.
		NewQuery("SELECT * FROM holes WHERE id = {:hole_id}").
		Bind(dbx.Params{
			"hole_id": holeId,
		}).
		One(&hole)

	if err != nil {
		return nil, err
	}

	return &hole, nil
}

func GetPlayerHoles(db dbx.Builder, playerId string) (*[]Hole, error) {
	var holes []Hole

	err := db.
		NewQuery("SELECT * FROM holes WHERE player_id = {:player_id} ORDER BY number").
		Bind(dbx.Params{
			"player_id": playerId,
		}).
		All(&holes)

	if err != nil {
		return nil, err
	}

	return &holes, nil
}

func GetHolesForTeam(db dbx.Builder, teamId string, tournamentId string) (*[]Hole, error) {
	var holes []Hole

	err := db.
		NewQuery(`
			SELECT 
				holes.*,
				players.handicap AS player_handicap,
				tournaments.awarded_handicap as awarded_handicap
			FROM holes
			JOIN players ON holes.player_id = players.id
			JOIN teams ON teams.id = players.team_id 
			JOIN tournaments ON tournaments.id = holes.tournament_id
			WHERE holes.tournament_id = {:tournament_id} and teams.id = {:team_id}
			ORDER BY  holes.number
		`).
		Bind(dbx.Params{
			"tournament_id": tournamentId,
			"team_id":       teamId,
		}).
		All(&holes)

	if err != nil {
		return nil, err
	}

	return &holes, nil
}

func GetHolesCountForTeam(db dbx.Builder, teamId string, tournamentId string) (*int, error) {
	var count int

	err := db.
		NewQuery(`
			SELECT 
				count(*)
			FROM holes
			JOIN players ON holes.player_id = players.id
			JOIN teams ON teams.id = players.team_id 
			WHERE teams.id = {:team_id}
		`).
		Bind(dbx.Params{
			"team_id": teamId,
		}).
		One(&count)

	if err != nil {
		return nil, err
	}

	return &count, nil
}

func GetHolesForTournamentId(db dbx.Builder, tournamentId string) (*[]Hole, error) {
	var holes []Hole

	err := db.
		NewQuery(`
			SELECT 
				holes.*,
			FROM holes
			JOIN players ON holes.player_id = players.id
			JOIN teams ON players.team_id = teams.id
			WHERE holes.tournament_id = {:tournament_id}
			ORDER BY holes.player_id, holes.number
		`).
		Bind(dbx.Params{
			"tournament_id": tournamentId,
		}).
		All(&holes)

	if err != nil {
		return nil, err
	}

	return &holes, nil
}

type HoleWithMetadata struct {
	Id                        string  `db:"id"`
	Score                     string  `db:"score"`
	Par                       int     `db:"par"`
	Handicap                  int     `db:"handicap"`
	Number                    int     `db:"number"`
	PlayerId                  string  `db:"player_id"`
	PlayerName                string  `db:"player_name"`
	TeamId                    string  `db:"team_id"`
	PlayerHandicap            float64 `db:"player_handicap"`
	AwardedTournamentHandicap float64 `db:"awarded_handicap"`
	StrokeHole                int
}

func GetHolesForLeaderboard(db dbx.Builder, tournamentId string) (*[]HoleWithMetadata, error) {
	var holes []HoleWithMetadata

	err := db.
		NewQuery(`
			SELECT 
				holes.*,
				teams.id AS team_id,
				players.id AS player_id,
				players.name AS player_name,
				players.handicap AS player_handicap,
				tournaments.awarded_handicap as awarded_handicap 
			FROM holes
			JOIN players ON holes.player_id = players.id
			JOIN teams ON players.team_id = teams.id
			JOIN tournaments ON holes.tournament_id = {:tournament_id}
			WHERE holes.tournament_id = {:tournament_id}
			GROUP BY holes.player_id, holes.number
			ORDER BY holes.number
		`).
		Bind(dbx.Params{
			"tournament_id": tournamentId,
		}).
		All(&holes)

	if err != nil {
		return nil, err
	}

	return &holes, nil
}

func CreateHoleForPlayer(db dbx.Builder, playerId string, tournamentId string, courseHole CourseHoleData) (*Hole, error) {
	var hole Hole

	err := db.
		NewQuery(`
		INSERT INTO holes (tournament_id, player_id, number, par, handicap, created, updated)
		VALUES ({:tournament_id}, {:player_id}, {:number}, {:par}, {:handicap}, {:created}, {:updated})
		RETURNING *
	`).
		Bind(dbx.Params{
			"tournament_id": tournamentId,
			"player_id":     playerId,
			"number":        courseHole.Number,
			"par":           courseHole.Par,
			"handicap":      courseHole.Handicap,
			"created":       time.Now().Format(time.RFC3339),
			"updated":       time.Now().Format(time.RFC3339),
		}).
		One(&hole)

	if err != nil {
		return nil, err
	}

	return &hole, nil
}

func CreateAllHolesForPlayer(db dbx.Builder, playerId, tournamentId string, courseData []CourseHoleData) (*[]Hole, error) {
	var holes []Hole
	for _, courseHole := range courseData {
		hole, err := CreateHoleForPlayer(db, playerId, tournamentId, courseHole)
		if err != nil {
			return nil, err
		}
		holes = append(holes, *hole)
	}

	return &holes, nil
}

type HoleUpdate struct {
	Id           *string  `json:"id,omitempty"`
	Score        *string  `json:"score,omitempty"`
	Par          *float64 `json:"par,omitempty"`
	Handicap     *float64 `json:"handicap,omitempty"`
	Number       *float64 `json:"number,omitempty"`
	PlayerId     *string  `json:"playerId,omitempty"`
	TournamentId *string  `json:"tournamentId,omitempty"`
}

func UpdateHoleForPlayer(db dbx.Builder, holeId string, updates HoleUpdate) (*HoleUpdate, error) {
	var setParts []string
	params := dbx.Params{"holeId": holeId}

	if updates.Score != nil {
		setParts = append(setParts, "score = {:score}")
		params["score"] = *updates.Score
	}
	if updates.Par != nil {
		setParts = append(setParts, "par = {:par}")
		params["par"] = *updates.Par
	}
	if updates.Handicap != nil {
		setParts = append(setParts, "handicap = {:handicap}")
		params["handicap"] = *updates.Handicap
	}
	if updates.Number != nil {
		setParts = append(setParts, "number = {:number}")
		params["number"] = *updates.Number
	}
	if updates.PlayerId != nil {
		setParts = append(setParts, "player_id = {:playerId}")
		params["playerId"] = *updates.PlayerId
	}
	if updates.TournamentId != nil {
		setParts = append(setParts, "tournament_id = {:tournamentId}")
		params["tournamentId"] = *updates.TournamentId
	}

	if len(setParts) == 0 {
		return nil, fmt.Errorf("no fields to update")
	}

	// Always update the 'updated' timestamp
	setParts = append(setParts, "updated = {:updated}")
	params["updated"] = time.Now().Format(time.RFC3339)

	query := fmt.Sprintf(`
		UPDATE holes 
		SET %s 
		WHERE id = {:holeId}
	`, strings.Join(setParts, ", "))

	_, err := db.NewQuery(query).Bind(params).Execute()
	if err != nil {
		return nil, err
	}

	return &updates, nil
}
