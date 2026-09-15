import { MigrationInterface, QueryRunner } from "typeorm";

export class AddProfileFeatureFields1789431630294 implements MigrationInterface {
    name = 'AddProfileFeatureFields1789431630294'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "app"."medical_team_members" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "userId" uuid NOT NULL, "name" character varying(100) NOT NULL, "role" character varying(100) NOT NULL, "contact" character varying(150), "photoUrl" character varying(500), CONSTRAINT "PK_2490870e7a24e0b4123c813d402" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "app"."users" ADD "planRenewalDate" date`);
        await queryRunner.query(`ALTER TABLE "app"."users" ADD "planCancelled" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "app"."users" ADD "notifyPush" boolean NOT NULL DEFAULT true`);
        await queryRunner.query(`ALTER TABLE "app"."users" ADD "notifyEmail" boolean NOT NULL DEFAULT true`);
        await queryRunner.query(`ALTER TABLE "app"."users" ADD "notifyProtocolReminders" boolean NOT NULL DEFAULT true`);
        await queryRunner.query(`ALTER TABLE "app"."users" ADD "notifyExamAlerts" boolean NOT NULL DEFAULT true`);
        await queryRunner.query(`ALTER TABLE "app"."medical_team_members" ADD CONSTRAINT "FK_1afbc8ace4c1b16d48bfae7376b" FOREIGN KEY ("userId") REFERENCES "app"."users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "app"."medical_team_members" DROP CONSTRAINT "FK_1afbc8ace4c1b16d48bfae7376b"`);
        await queryRunner.query(`ALTER TABLE "app"."users" DROP COLUMN "notifyExamAlerts"`);
        await queryRunner.query(`ALTER TABLE "app"."users" DROP COLUMN "notifyProtocolReminders"`);
        await queryRunner.query(`ALTER TABLE "app"."users" DROP COLUMN "notifyEmail"`);
        await queryRunner.query(`ALTER TABLE "app"."users" DROP COLUMN "notifyPush"`);
        await queryRunner.query(`ALTER TABLE "app"."users" DROP COLUMN "planCancelled"`);
        await queryRunner.query(`ALTER TABLE "app"."users" DROP COLUMN "planRenewalDate"`);
        await queryRunner.query(`DROP TABLE "app"."medical_team_members"`);
    }

}
