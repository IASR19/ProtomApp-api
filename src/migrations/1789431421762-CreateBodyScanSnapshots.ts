import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateBodyScanSnapshots1789431421762 implements MigrationInterface {
    name = 'CreateBodyScanSnapshots1789431421762'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "app"."body_scan_snapshots" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "userId" uuid NOT NULL, "bodyFat" numeric(5,2) NOT NULL, "visceralFat" numeric(5,2) NOT NULL, "weight" numeric(6,2) NOT NULL, "waist" numeric(6,2) NOT NULL, "leanMass" numeric(6,2) NOT NULL, "capturedAt" TIMESTAMP NOT NULL, CONSTRAINT "PK_72d631097219c68e535de8c4838" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "app"."body_scan_snapshots" ADD CONSTRAINT "FK_b776ac92309a8045c7cc2979d50" FOREIGN KEY ("userId") REFERENCES "app"."users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "app"."body_scan_snapshots" DROP CONSTRAINT "FK_b776ac92309a8045c7cc2979d50"`);
        await queryRunner.query(`DROP TABLE "app"."body_scan_snapshots"`);
    }

}
