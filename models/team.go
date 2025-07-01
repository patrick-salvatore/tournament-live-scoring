package models

import "github.com/pocketbase/dbx"

type Team struct {
	Id           string `db:"id" json:"id"`
	Name         string `db:"name" json:"name"`
	DisplayName  string `db:"display_name" json:"displayName"`
	Token        string `db:"token" json:"token"`
	TournamentId string `db:"tournament_id" json:"tournamentId"`
}

func GetTeamsByTournamentId(db dbx.Builder, tournamentId string) (*[]Team, error) {
	teams := []Team{}

	err := db.
		NewQuery("SELECT * FROM teams WHERE teams.tournament_id = {:tournament_id}").
		Bind(dbx.Params{
			"tournament_id": tournamentId,
		}).
		All(&teams)

	if err != nil {
		return nil, err
	}

	return &teams, nil
}

func GetTeamById(db dbx.Builder, id string) (*Team, error) {
	team := Team{}

	err := db.
		NewQuery("SELECT * FROM teams WHERE id = {:id}").
		Bind(dbx.Params{
			"id": id,
		}).
		One(&team)

	if err != nil {
		return nil, err
	}

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
