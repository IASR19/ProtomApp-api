import { MigrationInterface, QueryRunner } from "typeorm";

export class AlterUserHeightPrecision1781656516762 implements MigrationInterface {
    name = 'AlterUserHeightPrecision1781656516762'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "height" TYPE numeric(5,2)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "height" TYPE numeric(4,2)`);
    }

}
