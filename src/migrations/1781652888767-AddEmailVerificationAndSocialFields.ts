import { MigrationInterface, QueryRunner } from "typeorm";
import { getMigrationSchema } from "./utils/schema";

export class AddEmailVerificationAndSocialFields1781652888767 implements MigrationInterface {
    name = 'AddEmailVerificationAndSocialFields1781652888767'

    public async up(queryRunner: QueryRunner): Promise<void> {
        const schema = getMigrationSchema(queryRunner);
        const table = await queryRunner.getTable(`${schema}.users`);
        if (!table) {
            return;
        }

        if (!table.findColumnByName('googleId')) {
            await queryRunner.query(`ALTER TABLE "${schema}"."users" ADD "googleId" character varying(255)`);
            await queryRunner.query(`ALTER TABLE "${schema}"."users" ADD CONSTRAINT "UQ_f382af58ab36057334fb262efd5" UNIQUE ("googleId")`);
        }
        if (!table.findColumnByName('appleId')) {
            await queryRunner.query(`ALTER TABLE "${schema}"."users" ADD "appleId" character varying(255)`);
            await queryRunner.query(`ALTER TABLE "${schema}"."users" ADD CONSTRAINT "UQ_60cea0d80c39eedaaaf5e21f175" UNIQUE ("appleId")`);
        }
        if (!table.findColumnByName('isEmailVerified')) {
            await queryRunner.query(`ALTER TABLE "${schema}"."users" ADD "isEmailVerified" boolean NOT NULL DEFAULT false`);
        }
        if (!table.findColumnByName('emailVerificationToken')) {
            await queryRunner.query(`ALTER TABLE "${schema}"."users" ADD "emailVerificationToken" character varying(255)`);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const schema = getMigrationSchema(queryRunner);
        await queryRunner.query(`ALTER TABLE "${schema}"."users" DROP COLUMN "emailVerificationToken"`);
        await queryRunner.query(`ALTER TABLE "${schema}"."users" DROP COLUMN "isEmailVerified"`);
        await queryRunner.query(`ALTER TABLE "${schema}"."users" DROP CONSTRAINT "UQ_60cea0d80c39eedaaaf5e21f175"`);
        await queryRunner.query(`ALTER TABLE "${schema}"."users" DROP COLUMN "appleId"`);
        await queryRunner.query(`ALTER TABLE "${schema}"."users" DROP CONSTRAINT "UQ_f382af58ab36057334fb262efd5"`);
        await queryRunner.query(`ALTER TABLE "${schema}"."users" DROP COLUMN "googleId"`);
    }

}
