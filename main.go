package main

import (
	"log"

	"github.com/joho/godotenv"
	"github.com/patrick-salvatore/tournament-live-scoring/ui"
	"github.com/pocketbase/pocketbase"
	"github.com/pocketbase/pocketbase/apis"
	"github.com/pocketbase/pocketbase/core"
)

func main() {
	if err := godotenv.Load(); err != nil {
		panic(err)
	}

	app := pocketbase.New()

	app.OnServe().BindFunc(func(se *core.ServeEvent) error {
		se.Router.GET("/{path...}", apis.Static(ui.DistDirFS, true)).BindFunc(func(e *core.RequestEvent) error {
			if e.Request.PathValue(apis.StaticWildcardParam) != "" {
				e.Response.Header().Set("Cache-Control", "max-age=1209600, stale-while-revalide=86400")
			}
			return e.Next()
		}).Bind(apis.Gzip())

		return se.Next()
	})

	if err := app.Start(); err != nil {
		log.Fatal(err)
	}
}
