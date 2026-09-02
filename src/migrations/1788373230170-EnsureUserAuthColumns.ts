import { MigrationInterface, QueryRunner } from "typeorm";

export class EnsureUserAuthColumns1788373230170 implements MigrationInterface {
    name = 'EnsureUserAuthColumns1788373230170'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "initialWeight" numeric(6,2)`);
        await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "googleId" character varying(255)`);
        await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "appleId" character varying(255)`);
        await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "isEmailVerified" boolean NOT NULL DEFAULT true`);
        await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "emailVerificationToken" character varying(255)`);
        await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "refreshTokenHash" character varying(255)`);

        await queryRunner.query(`
            DO $$ BEGIN
                ALTER TABLE "users" ADD CONSTRAINT "UQ_f382af58ab36057334fb262efd5" UNIQUE ("googleId");
            EXCEPTION
                WHEN duplicate_object THEN NULL;
                WHEN duplicate_table THEN NULL;
            END $$;
        `);
        await queryRunner.query(`
            DO $$ BEGIN
                ALTER TABLE "users" ADD CONSTRAINT "UQ_60cea0d80c39eedaaaf5e21f175" UNIQUE ("appleId");
            EXCEPTION
                WHEN duplicate_object THEN NULL;
                WHEN duplicate_table THEN NULL;
            END $$;
        `);

        await queryRunner.query(`UPDATE "users" SET "isEmailVerified" = true WHERE "isEmailVerified" = false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "emailVerificationToken"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "isEmailVerified"`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "UQ_60cea0d80c39eedaaaf5e21f175"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "appleId"`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "UQ_f382af58ab36057334fb262efd5"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "googleId"`);
    }
}
