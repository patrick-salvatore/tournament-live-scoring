package utils

import (
	"os"

	"github.com/jackc/pgx/v5/pgtype"
)

func GetNumericalValue(numeric pgtype.Numeric) int {
	var value int

	if numeric.Valid {
		valueInt64, err := numeric.Int64Value()
		if err == nil {
			value = int(valueInt64.Int64)
		} else {
			value = 0
		}
	}

	return value
}

func GetEnvVarOrPanic(key string) string {
	value := os.Getenv(key)
	if value == "" {
		panic(key + " is not set")
	}

	return value
}
