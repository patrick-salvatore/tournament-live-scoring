-- name: GetUser :one
SELECT * FROM "User" WHERE "id" = $1;

-- name: GetUsers :many
SELECT * FROM "User";

-- name: GetUserByEmail :one
SELECT * FROM "User" WHERE "email" = $1;

-- name: GetUserByKindeId :one
SELECT * FROM "User" WHERE "kindeId" = $1;

-- name: CreateUser :one
INSERT INTO "User" (email, username, "kindeId") VALUES ($1, $2, $3)
RETURNING *;

-- name: UpdateUser :one
UPDATE "User"
SET email = $1, username = $2
WHERE "kindeId" = $3
RETURNING *;

-- -- name: SoftDeleteUser :one
-- UPDATE users SET "status" = 'DEACTIVATED'
-- WHERE id = $1
-- RETURNING *;

-- name: DeleteUser :one
DELETE FROM "User" WHERE id = $1
RETURNING *;
