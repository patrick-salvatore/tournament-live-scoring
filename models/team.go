package models

import (
	"fmt"
	"strings"
	"time"

	"github.com/pocketbase/dbx"
)

type Player struct {
	Id       string  `db:"id" json:"id"`
	Name     string  `db:"name" json:"name"`
	Handicap float64 `db:"handicap" json:"handicap"`
}

type Team struct {
	Id           string   `db:"id" json:"id"`
	Name         string   `db:"name" json:"name"`
	DisplayName  string   `db:"display_name" json:"displayName"`
	Token        string   `db:"token" json:"token"`
	TournamentId string   `db:"tournament_id" json:"tournamentId"`
	Finished     bool     `db:"finished" json:"finished"`
	Started      bool     `db:"started" json:"started"`
	Players      []Player `json:"players"`
}

func GetTeamsByTournamentId(db dbx.Builder, tournamentId string) (*[]Team, error) {
	teams := []Team{}

	err := db.
		NewQuery(`
			SELECT 
				teams.*
			FROM teams
			WHERE teams.tournament_id = {:tournament_id}
		`).
		Bind(dbx.Params{
			"tournament_id": tournamentId,
		}).
		All(&teams)

	if err != nil {
		return nil, err
	}

	return &teams, nil
}

func GetTeamById(db dbx.Builder, teamId string) (*Team, error) {
	team := Team{}

	err := db.
		NewQuery(`
			SELECT 
				teams.*
			FROM teams
			WHERE teams.id = {:team_id}
		`).
		Bind(dbx.Params{
			"team_id": teamId,
		}).
		One(&team)

	if err != nil {
		return nil, err
	}

	// Step 2: Get all players for these teams
	var players []Player
	err = db.
		NewQuery(`
			SELECT players.*, players.team_id 
			FROM players
			JOIN teams ON players.team_id = teams.id
			WHERE teams.id = {:team_id}
		`).
		Bind(dbx.Params{
			"team_id": teamId,
		}).
		All(&players)

	if err != nil {
		return nil, err
	}

	team.Players = players

	return &team, nil
}

type TeamWithTournament struct {
	Team
	TournamentName     string `db:"tournament_name" json:"tournamentName"`
	TournamentComplete bool   `db:"tournament_complete" json:"tournamentComplete"`
	TournamentCourseId string `db:"tournament_course_id" json:"tournamentCourseId"`
	TournamentUuid     string `db:"tournament_uuid" json:"tournamentUuid"`
}

func GetTeamByIdWithTournamentData(db dbx.Builder, id string) (*TeamWithTournament, error) {
	team := TeamWithTournament{}

	err := db.
		NewQuery(`
			SELECT 
				t.id,
				t.name,
				t.Token,
				t.tournament_id,
				t.created,
				t.updated,
				tournament.id AS tournament_id,
				tournament.uuid AS tournament_uuid,
				tournament.name AS tournament_name,
				tournament.course_id AS tournament_course_id,
				tournament.complete AS tournament_complete
			FROM teams t 
			JOIN tournaments tournament ON t.tournament_id = tournament.id 
			WHERE t.id = {:id}`).
		Bind(dbx.Params{
			"id": id,
		}).
		One(&team)

	if err != nil {
		return nil, err
	}

	return &team, nil
}

type TeamUpdate struct {
	Name        *string `json:"name,omitempty"`
	DisplayName *string `json:"displayName,omitempty"`
	Finished    *bool   `json:"finished,omitempty"`
	Started     *bool   `json:"started,omitempty"`
}

func UpdateTeam(db dbx.Builder, teamId string, updates TeamUpdate) (*TeamUpdate, error) {
	var setParts []string
	params := dbx.Params{"teamId": teamId}

	if updates.Name != nil {
		params["name"] = *updates.Name
		setParts = append(setParts, "name = {:name}")
	}
	if updates.DisplayName != nil {
		params["displayName"] = *updates.DisplayName
		setParts = append(setParts, "displayName = {:displayName}")
	}
	if updates.Finished != nil {
		params["finished"] = *updates.Finished
		setParts = append(setParts, "finished = {:finished}")
	}
	if updates.Started != nil {
		params["started"] = *updates.Started
		setParts = append(setParts, "started = {:started}")
	}

	if len(setParts) == 0 {
		return nil, fmt.Errorf("no fields to update")
	}

	// Always update the 'updated' timestamp
	setParts = append(setParts, "updated = {:updated}")
	params["updated"] = time.Now().Format(time.RFC3339)

	query := fmt.Sprintf(`
		UPDATE teams 
		SET %s 
		WHERE id = {:teamId}
	`, strings.Join(setParts, ", "))

	_, err := db.NewQuery(query).Bind(params).Execute()
	if err != nil {
		return nil, err
	}

	return &updates, nil
}
