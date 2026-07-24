-- Migración manual: Indice único parcial
CREATE UNIQUE INDEX "Match_one_active_per_user"
    ON "Match"("userId") WHERE "status" = 'IN_PROGRESS';