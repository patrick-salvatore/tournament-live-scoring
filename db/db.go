package db

import (
	"context"
	"log"

	"github.com/jackc/pgx/v5/pgxpool"
)

var Db *pgxpool.Pool

func CreateDbConn(dbConnStr string) (*pgxpool.Pool, error) {
	pool, err := pgxpool.New(context.Background(), dbConnStr)
	if err != nil {
		log.Fatalf("unable to connect to database: %v\n", err)
	}

	Db = pool
	return pool, nil
}

func CloseDbConn() error {
	Db.Close()

	return nil
}
