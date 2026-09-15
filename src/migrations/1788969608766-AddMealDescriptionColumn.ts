import { MigrationInterface, QueryRunner } from "typeorm";
import { getMigrationSchema } from "./utils/schema";

export class AddMealDescriptionColumn1788969608766 implements MigrationInterface {
    name = 'AddMealDescriptionColumn1788969608766'

    public async up(queryRunner: QueryRunner): Promise<void> {
        const schema = getMigrationSchema(queryRunner);
        await queryRunner.query(`ALTER TABLE "${schema}"."meals" ADD COLUMN IF NOT EXISTS "description" text`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const schema = getMigrationSchema(queryRunner);
        await queryRunner.query(`ALTER TABLE "${schema}"."meals" DROP COLUMN IF EXISTS "description"`);
    }
}
