import { MigrationInterface, QueryRunner } from "typeorm";
import { getMigrationSchema } from "./utils/schema";

export class AlterUserHeightPrecision1781656516762 implements MigrationInterface {
    name = 'AlterUserHeightPrecision1781656516762'

    public async up(queryRunner: QueryRunner): Promise<void> {
        const schema = getMigrationSchema(queryRunner);
        await queryRunner.query(`ALTER TABLE "${schema}"."users" ALTER COLUMN "height" TYPE numeric(5,2)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const schema = getMigrationSchema(queryRunner);
        await queryRunner.query(`ALTER TABLE "${schema}"."users" ALTER COLUMN "height" TYPE numeric(4,2)`);
    }

}
