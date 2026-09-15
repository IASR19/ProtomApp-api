import { MigrationInterface, QueryRunner } from "typeorm";
import { getMigrationSchema } from "./utils/schema";

export class AddProfileFeatureFields1789431630294 implements MigrationInterface {
    name = 'AddProfileFeatureFields1789431630294'

    public async up(queryRunner: QueryRunner): Promise<void> {
        const schema = getMigrationSchema(queryRunner);
        await queryRunner.query(`CREATE TABLE "${schema}"."medical_team_members" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "userId" uuid NOT NULL, "name" character varying(100) NOT NULL, "role" character varying(100) NOT NULL, "contact" character varying(150), "photoUrl" character varying(500), CONSTRAINT "PK_2490870e7a24e0b4123c813d402" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "${schema}"."users" ADD "planRenewalDate" date`);
        await queryRunner.query(`ALTER TABLE "${schema}"."users" ADD "planCancelled" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "${schema}"."users" ADD "notifyPush" boolean NOT NULL DEFAULT true`);
        await queryRunner.query(`ALTER TABLE "${schema}"."users" ADD "notifyEmail" boolean NOT NULL DEFAULT true`);
        await queryRunner.query(`ALTER TABLE "${schema}"."users" ADD "notifyProtocolReminders" boolean NOT NULL DEFAULT true`);
        await queryRunner.query(`ALTER TABLE "${schema}"."users" ADD "notifyExamAlerts" boolean NOT NULL DEFAULT true`);
        await queryRunner.query(`ALTER TABLE "${schema}"."medical_team_members" ADD CONSTRAINT "FK_1afbc8ace4c1b16d48bfae7376b" FOREIGN KEY ("userId") REFERENCES "${schema}"."users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const schema = getMigrationSchema(queryRunner);
        await queryRunner.query(`ALTER TABLE "${schema}"."medical_team_members" DROP CONSTRAINT "FK_1afbc8ace4c1b16d48bfae7376b"`);
        await queryRunner.query(`ALTER TABLE "${schema}"."users" DROP COLUMN "notifyExamAlerts"`);
        await queryRunner.query(`ALTER TABLE "${schema}"."users" DROP COLUMN "notifyProtocolReminders"`);
        await queryRunner.query(`ALTER TABLE "${schema}"."users" DROP COLUMN "notifyEmail"`);
        await queryRunner.query(`ALTER TABLE "${schema}"."users" DROP COLUMN "notifyPush"`);
        await queryRunner.query(`ALTER TABLE "${schema}"."users" DROP COLUMN "planCancelled"`);
        await queryRunner.query(`ALTER TABLE "${schema}"."users" DROP COLUMN "planRenewalDate"`);
        await queryRunner.query(`DROP TABLE "${schema}"."medical_team_members"`);
    }

}
