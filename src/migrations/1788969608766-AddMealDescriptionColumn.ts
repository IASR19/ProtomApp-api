import { MigrationInterface, QueryRunner } from "typeorm";

export class AddMealDescriptionColumn1788969608766 implements MigrationInterface {
    name = 'AddMealDescriptionColumn1788969608766'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "meals" ADD COLUMN IF NOT EXISTS "description" text`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "meals" DROP COLUMN IF EXISTS "description"`);
    }
}
