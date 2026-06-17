import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateInitialTables1781652526112 implements MigrationInterface {
    name = 'CreateInitialTables1781652526112'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "name" character varying(100) NOT NULL, "email" character varying(200) NOT NULL, "passwordHash" character varying(255) NOT NULL, "age" integer, "sex" character varying(20), "height" numeric(4,2), "weight" numeric(6,2), "goalWeight" numeric(6,2), "objective" character varying(30), "trainingFrequency" character varying(30), "plan" character varying(20) NOT NULL DEFAULT 'Premium', "disclaimerAccepted" boolean NOT NULL DEFAULT false, "refreshTokenHash" character varying(255), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "meals" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "userId" uuid NOT NULL, "meal" character varying(150) NOT NULL, "totalKcal" integer NOT NULL, "goalKcal" integer NOT NULL, "proteinGrams" integer NOT NULL, "proteinPercent" integer NOT NULL, "carbGrams" integer NOT NULL, "carbPercent" integer NOT NULL, "fatGrams" integer NOT NULL, "fatPercent" integer NOT NULL, CONSTRAINT "PK_e6f830ac9b463433b58ad6f1a59" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "exams" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "userId" uuid NOT NULL, "name" character varying(150) NOT NULL, "date" character varying(50) NOT NULL, "status" character varying(50) NOT NULL DEFAULT 'Analisado', "type" character varying(20) NOT NULL DEFAULT 'pdf', CONSTRAINT "PK_b43159ee3efa440952794b4f53e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "partners" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "name" character varying(150) NOT NULL, "brand" character varying(100) NOT NULL, "discount" character varying(20) NOT NULL, "category" character varying(50) NOT NULL, "icon" character varying(50) NOT NULL DEFAULT 'nutrition', CONSTRAINT "PK_998645b20820e4ab99aeae03b41" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "exam_evolutions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "userId" uuid NOT NULL, "name" character varying(100) NOT NULL, "unit" character varying(20) NOT NULL, "current" numeric(6,2) NOT NULL, "previous" numeric(6,2) NOT NULL, "monthCurrent" character varying(50) NOT NULL, "monthPrevious" character varying(50) NOT NULL, "status" character varying(50) NOT NULL DEFAULT 'normal', CONSTRAINT "PK_5520e85ed4c98e31fa5e7c6e98f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "prescriptions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "userId" uuid NOT NULL, "title" character varying(200) NOT NULL, "sentBy" character varying(150) NOT NULL, "date" character varying(50) NOT NULL, "status" character varying(150) NOT NULL, "statusType" character varying(50) NOT NULL DEFAULT 'signed', "icon" character varying(50) NOT NULL DEFAULT 'document-text', CONSTRAINT "PK_097b2cc2f2b7e56825468188503" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "protocol_tasks" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "protocolId" uuid NOT NULL, "time" character varying(10) NOT NULL, "title" character varying(150) NOT NULL, "description" text, "tag" character varying(50) NOT NULL, "done" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_ceb4f616e3ddd6a9bfaee9e848f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "supplements" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "protocolId" uuid NOT NULL, "name" character varying(150) NOT NULL, "dose" character varying(50) NOT NULL, "time" character varying(10) NOT NULL, "purpose" text, "icon" character varying(50) NOT NULL DEFAULT 'leaf-outline', "phase" character varying(50) NOT NULL, CONSTRAINT "PK_a6e672a936a1d1a967caeaef962" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "protocols" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "userId" uuid NOT NULL, "adherence" integer NOT NULL DEFAULT '100', "recovery" integer NOT NULL DEFAULT '80', "sleep" character varying(20) NOT NULL DEFAULT '7h', "hydration" character varying(20) NOT NULL DEFAULT '2L', "fastingHours" character varying(20) NOT NULL DEFAULT '12h', "version" character varying(20) NOT NULL DEFAULT '1.0', "doctor" character varying(100) NOT NULL DEFAULT 'Dr. James', "crm" character varying(50) NOT NULL DEFAULT 'CRM-SP 123456', "objective" character varying(200) NOT NULL DEFAULT 'Geral', "nextReview" character varying(50) NOT NULL DEFAULT '15/07/2026', "isActive" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_69900eec42c88582ac8affff3e1" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "medications" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "protocolId" uuid NOT NULL, "name" character varying(150) NOT NULL, "dose" character varying(50) NOT NULL, "route" character varying(50) NOT NULL, "time" character varying(10) NOT NULL, "frequency" character varying(100) NOT NULL, "instructions" text, "combinations" text, CONSTRAINT "PK_cdee49fe7cd79db13340150d356" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "workouts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "userId" uuid NOT NULL, "title" character varying(150) NOT NULL, "description" text, "duration" integer NOT NULL DEFAULT '0', "calories" integer NOT NULL DEFAULT '0', "cardio" character varying(200), CONSTRAINT "PK_5b2319bf64a674d40237dbb1697" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "workout_exercises" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "workoutId" uuid NOT NULL, "name" character varying(150) NOT NULL, "sets" integer NOT NULL, "reps" integer NOT NULL, "weight" integer NOT NULL, CONSTRAINT "PK_377f9ead6fd69b29f0d0feb1028" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "meals" ADD CONSTRAINT "FK_3111c7cf13da976d7ed18287811" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "exams" ADD CONSTRAINT "FK_5ec7ff70b19e78f3d412addad4f" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "exam_evolutions" ADD CONSTRAINT "FK_71bbb405e0c0f686e30d06789ed" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "prescriptions" ADD CONSTRAINT "FK_35cbbc56c94726c18d9e74fb1e2" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "protocol_tasks" ADD CONSTRAINT "FK_781a6d90d895dd34e6aee8699ae" FOREIGN KEY ("protocolId") REFERENCES "protocols"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "supplements" ADD CONSTRAINT "FK_202b14cf7c0950a7b2cc5db5064" FOREIGN KEY ("protocolId") REFERENCES "protocols"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "protocols" ADD CONSTRAINT "FK_3c12c83a8c140f81f85583454cd" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "medications" ADD CONSTRAINT "FK_59520407280634e998dda78375f" FOREIGN KEY ("protocolId") REFERENCES "protocols"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "workouts" ADD CONSTRAINT "FK_65ff5fd1913246288adad5dc75a" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "workout_exercises" ADD CONSTRAINT "FK_d616bcfffe0b6bb322281ae3754" FOREIGN KEY ("workoutId") REFERENCES "workouts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "workout_exercises" DROP CONSTRAINT "FK_d616bcfffe0b6bb322281ae3754"`);
        await queryRunner.query(`ALTER TABLE "workouts" DROP CONSTRAINT "FK_65ff5fd1913246288adad5dc75a"`);
        await queryRunner.query(`ALTER TABLE "medications" DROP CONSTRAINT "FK_59520407280634e998dda78375f"`);
        await queryRunner.query(`ALTER TABLE "protocols" DROP CONSTRAINT "FK_3c12c83a8c140f81f85583454cd"`);
        await queryRunner.query(`ALTER TABLE "supplements" DROP CONSTRAINT "FK_202b14cf7c0950a7b2cc5db5064"`);
        await queryRunner.query(`ALTER TABLE "protocol_tasks" DROP CONSTRAINT "FK_781a6d90d895dd34e6aee8699ae"`);
        await queryRunner.query(`ALTER TABLE "prescriptions" DROP CONSTRAINT "FK_35cbbc56c94726c18d9e74fb1e2"`);
        await queryRunner.query(`ALTER TABLE "exam_evolutions" DROP CONSTRAINT "FK_71bbb405e0c0f686e30d06789ed"`);
        await queryRunner.query(`ALTER TABLE "exams" DROP CONSTRAINT "FK_5ec7ff70b19e78f3d412addad4f"`);
        await queryRunner.query(`ALTER TABLE "meals" DROP CONSTRAINT "FK_3111c7cf13da976d7ed18287811"`);
        await queryRunner.query(`DROP TABLE "workout_exercises"`);
        await queryRunner.query(`DROP TABLE "workouts"`);
        await queryRunner.query(`DROP TABLE "medications"`);
        await queryRunner.query(`DROP TABLE "protocols"`);
        await queryRunner.query(`DROP TABLE "supplements"`);
        await queryRunner.query(`DROP TABLE "protocol_tasks"`);
        await queryRunner.query(`DROP TABLE "prescriptions"`);
        await queryRunner.query(`DROP TABLE "exam_evolutions"`);
        await queryRunner.query(`DROP TABLE "partners"`);
        await queryRunner.query(`DROP TABLE "exams"`);
        await queryRunner.query(`DROP TABLE "meals"`);
        await queryRunner.query(`DROP TABLE "users"`);
    }

}
