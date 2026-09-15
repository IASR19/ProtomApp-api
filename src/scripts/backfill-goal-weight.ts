import { AppDataSource } from '../data-source';
import { UserEntity } from '../modules/users/entities/user.entity';

/**
 * Backfill único para usuários cadastrados ANTES do onboarding passar a coletar
 * `goalWeight` de verdade. Não inventa um número universal (o bug que estamos
 * corrigindo) — deriva uma meta modesta a partir de dados reais do próprio usuário
 * (peso atual + objetivo já escolhido no onboarding):
 *   - Emagrecimento: -10% do peso atual
 *   - Hipertrofia:   +5% do peso atual
 *   - Performance:   mantém o peso atual (objetivo não é variação de peso)
 *
 * Só atualiza usuários com `weight` preenchido (onboarding real já concluído) e
 * `goalWeight` ainda nulo. Roda uma vez; seguro rodar de novo (idempotente, pois
 * usuários já com goalWeight são ignorados).
 *
 * Uso: npm run backfill:goal-weight
 */
async function main() {
  const dataSource = await AppDataSource.initialize();
  const usersRepository = dataSource.getRepository(UserEntity);

  const candidates = await usersRepository
    .createQueryBuilder('user')
    .where('user.weight IS NOT NULL')
    .andWhere('user.goalWeight IS NULL')
    .getMany();

  console.log(`Usuários elegíveis para backfill de goalWeight: ${candidates.length}`);

  let updated = 0;
  for (const user of candidates) {
    const weight = Number(user.weight);
    if (!weight) continue;

    let goalWeight: number;
    switch (user.objective) {
      case 'Emagrecimento':
        goalWeight = Math.round(weight * 0.9);
        break;
      case 'Hipertrofia':
        goalWeight = Math.round(weight * 1.05);
        break;
      default:
        goalWeight = Math.round(weight);
    }

    await usersRepository.update(user.id, { goalWeight });
    updated++;
    console.log(
      `  - ${user.email}: peso=${weight}kg objetivo=${user.objective ?? '(não definido)'} -> meta=${goalWeight}kg`,
    );
  }

  console.log(`Concluído. ${updated} usuário(s) atualizado(s).`);
  await dataSource.destroy();
}

main().catch((error) => {
  console.error('Falha no backfill de goalWeight:', error);
  process.exit(1);
});
