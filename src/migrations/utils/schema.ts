import { QueryRunner } from 'typeorm';
import type { PostgresDataSourceOptions } from 'typeorm/driver/postgres/PostgresDataSourceOptions';

/**
 * Schema configurado de verdade pra essa conexão (mesma resolução usada em
 * data-source.ts/app.module.ts: `DB_SCHEMA` ou 'app'). Nunca hardcode o nome do
 * schema como string literal numa migration — ambientes diferentes (dev local vs.
 * produção no Railway, por exemplo) podem ter valores diferentes, e uma migration
 * escrita com o schema fixo funciona só onde esse literal calha de bater com a
 * config real.
 */
export function getMigrationSchema(queryRunner: QueryRunner): string {
  const options = queryRunner.dataSource.options as PostgresDataSourceOptions;
  return options.schema || 'app';
}
