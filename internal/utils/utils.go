package utils

import (
	"os"
)

func GetEnvVarOrPanic(key string) string {
	value := os.Getenv(key)
	if value == "" {
		panic(key + " is not set")
	}

	return value
}
