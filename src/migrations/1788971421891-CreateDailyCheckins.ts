import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateDailyCheckins1788971421891 implements MigrationInterface {
    name = 'CreateDailyCheckins1788971421891'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "daily_checkins" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                "userId" uuid NOT NULL,
                "date" date NOT NULL,
                "sleepHours" numeric(3,1) NOT NULL,
                "sleepQuality" integer NOT NULL,
                "fatigue" integer NOT NULL,
                "soreness" integer NOT NULL,
                "stress" integer NOT NULL,
                "mood" integer NOT NULL,
                "sleepScore" integer NOT NULL,
                "recoveryScore" integer NOT NULL,
                CONSTRAINT "PK_daily_checkins_id" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            DO $$ BEGIN
                ALTER TABLE "daily_checkins" ADD CONSTRAINT "UQ_daily_checkins_userId_date" UNIQUE ("userId", "date");
            EXCEPTION
                WHEN duplicate_object THEN NULL;
            END $$;
        `);
        await queryRunner.query(`
            DO $$ BEGIN
                ALTER TABLE "daily_checkins" ADD CONSTRAINT "FK_daily_checkins_userId" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
            EXCEPTION
                WHEN duplicate_object THEN NULL;
            END $$;
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS "daily_checkins"`);
    }
}
