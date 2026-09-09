# Estratégia temporária de dados de wearable (sono, recuperação)

Status: check-in manual implementado (backend + frontend); demais
achados da varredura ampla catalogados como follow-up, ver seção
"Achados adicionais" abaixo.
Data: 2026-09-09
Repos envolvidos: `ProtomApp` (frontend) e `ProtomApp-api` (backend)

## Contexto

O app ainda não tem integração real com wearable (Apple Health, Health
Connect, Whoop, Oura, etc). Hoje, os campos que deveriam vir de um
dispositivo são, na verdade, valores estáticos:

- `ProtomApp-api/src/modules/protocol/services/protocol.service.ts:536`
  — `protocol.recovery = 85;` com o comentário `// Default wearable
  telemetry`. É o mesmo valor pra todo mundo, sempre.
- `ProtomApp-api/src/modules/protocol/services/protocol.service.ts:537`
  — `protocol.sleep = isEmagrecimento ? '6h45' : '7h30'`. É a *meta*
  de sono definida no momento em que o protocolo é gerado (ou um
  valor sugerido pela IA em `aiData.protocol.sleep`), não uma medição.
- `ProtomApp-api/src/modules/users/services/users.service.ts:160-168`
  — usa esse valor estático para gerar um alerta com o texto *"Você
  registrou X horas de sono na noite passada"*, que dá a entender que
  é dado medido.
- `ProtomApp/src/components/MetabolicScoreCard.tsx` — usa
  `wearableData.sleep` (peso 20%) e `wearableData.recovery` (peso
  20%) no cálculo do Score Metabólico. Juntos são 40% do score,
  vindos de números estáticos.
- `avgHeartRate: 68` — hardcoded em `users.service.ts`, campo morto:
  não é usado em nenhum cálculo nem exibido em nenhuma tela hoje.
  Não precisa de substituto.

**Risco principal:** não é só "funcionalidade faltando" — é dado
inventado sendo apresentado como medição pessoal real. Isso é o que
resolver primeiro, antes de pensar em wearable de verdade.

## O que foi implementado (2026-09-09)

- **Backend** (`ProtomApp-api`): novo módulo `wellness`
  (`src/modules/wellness/`) com `DailyCheckinEntity` (tabela
  `daily_checkins`, 1 registro por usuário/dia), `WellnessService`
  (`calculateSleepScore`, `calculateRecoveryScore` estilo
  Hooper-Mackinnon) e `WellnessController` (`POST /wellness/checkin`,
  `GET /wellness/checkin/today`, `GET /wellness/checkin/history`).
  Migration `1788971421891-CreateDailyCheckins`.
- `UsersService.getDashboard` não usa mais `protocol.recovery`/
  `protocol.sleep` estáticos — busca o check-in de hoje via
  `WellnessService`. Sem check-in, o score não inventa valor: o peso
  de sono+recuperação (50%) é redistribuído para aderência (80%) +
  exames (20%), e um alerta "Faça seu check-in de hoje" aparece em
  vez do alerta de sono fabricado.
- `avgHeartRate` (campo morto, hardcoded `68`) foi removido da
  resposta do dashboard.
- `weightProgress` no Score Metabólico agora usa a meta real do
  usuário (`goalWeight`) em vez de uma constante `-10` hardcoded com
  fallback silencioso pra `50`.
- **Frontend** (`ProtomApp`): nova tela `DailyCheckinScreen` (rota
  `DailyCheckin`), formulário com horas de sono + 5 perguntas de 1-5
  (qualidade do sono, fadiga, dor muscular, estresse, humor).
  `MetabolicScoreCard` mostra um estado vazio ("Sem check-in hoje —
  toque para registrar") em vez das barras de sono/recuperação
  quando não há check-in, com CTA que abre a tela. Texto do rodapé do
  card deixou de afirmar "atualizado em tempo real" para explicar a
  origem real dos dados.
- `SmartAlertsCard`: categoria `wearable` renomeada para `wellness`;
  tipo `AlertLevel` ganhou `success`/`info` (o backend já enviava
  `level: 'success'` para alertas normais e isso **não existia** no
  tipo nem no componente de badge — bug de runtime latente,
  corrigido de passagem).
- Removidos rótulos que afirmavam hardware/IA inexistente:
  "BPM (APPLE WATCH)" no HUD do treino (`Workout3DScreen`, sem
  substituto — não dá pra autorreportar BPM em tempo real durante o
  treino, então o card foi só removido), "Apple Watch Conectado" no
  Perfil (agora "Nenhum conectado"), "SONO (OURA)"/"RECUPERAÇÃO" no
  `ProtocolScreen` (agora "SONO (META)"/"RECUPERAÇÃO (META)", já que
  são metas do protocolo, não leituras de dispositivo).

## O que fazer agora (substituto manual, "setável" pelo usuário)

Ideia: trocar telemetria de wearable por **check-in diário
autorreportado**, seguindo o modelo de questionário de bem-estar
(Hooper-Mackinnon) usado em plataformas de monitoramento de atletas
como substituto validado de HRV/recovery de dispositivo — desde que
seja rotulado como autoavaliação, não como medição de sensor.

### 1. Sono — input direto
- Pergunta diária: "Quantas horas você dormiu?" (numérico ou slider)
  + "Como foi a qualidade do sono?" (escala rápida de 1 a 5, ex:
  😴 Péssima ... 😄 Ótima).
- Mesmo padrão usado por apps de sono quando não há wearable
  conectado (ex: Sleep Cycle, RiseUp permitem entrada manual).

### 2. Recuperação — questionário de bem-estar (estilo Hooper-Mackinnon)
- 3-4 perguntas rápidas, escala 1-5, feitas de manhã:
  - Fadiga
  - Dor muscular
  - Estresse
  - Humor / disposição
- Combinar (inverter e normalizar) em um score 0-100, do mesmo jeito
  que apps de monitoramento de atletas fazem com esse questionário.
- É metodologia validada, não "número aleatório" — mas o rótulo na
  UI precisa deixar claro que é autoavaliação ("Recuperação
  (autoavaliação)"), não output de sensor.

### 3. Frequência cardíaca — remover por enquanto
- Não é usada em nenhum lugar hoje. Não vale inventar substituto
  manual (auto-medir FC média do dia não é realista). Só tirar o
  campo da interface `MetabolicScoreDetails` até haver integração
  real.

### 4. Transparência na UI
- Quando não houver check-in do dia, mostrar estado vazio ("Sem
  check-in hoje") em vez de reaproveitar o valor de ontem ou um
  default de 85.
- Trocar a linguagem do alerta de sono para não implicar medição
  automática (ex: "Você registrou..." → "Segundo seu check-in de
  hoje...").

### 5. Feature flag `wearableEnabled`
- Default: `false` (modo manual/beta descrito acima).
- Quando `true`: troca a fonte de dado pro pipeline de wearable real
  (a construir — ver seção seguinte).
- Permite ligar a feature por usuário/cohort quando a integração de
  verdade estiver pronta, sem quebrar quem ainda não tem.

## O que falta para a função ideal (wearable real)

1. **Escolher a via de integração**
   - Apple HealthKit + Google Health Connect (nativo do celular, não
     depende do usuário ter um dispositivo dedicado, maior alcance).
   - vs. API de fabricante específico (Whoop/Oura/Garmin — recovery
     baseado em HRV de verdade, mas exige hardware próprio e integra
     menos usuários no início).
   - Provavelmente HealthKit/Health Connect primeiro (maior alcance),
     com Whoop/Oura como fonte adicional depois.

2. **Backend**
   - Nova tabela (`wearable_samples` ou similar): userId, data,
     fonte (`healthkit`/`health_connect`/`whoop`/...), sono (horas +
     estágios se disponível), HRV, FC de repouso, timestamp de sync.
   - Endpoint de ingestão (sync periódico do app ou webhook do
     provedor, dependendo da fonte).
   - Regra de precedência quando existir tanto check-in manual quanto
     dado de wearable no mesmo dia (wearable deve prevalecer).

3. **Frontend (mobile)**
   - Sai do escopo 100% Expo-managed puro: precisa de config plugin
     (`expo-health-connect`, `react-native-health` ou equivalente) e
     possivelmente prebuild/EAS build customizado.
   - Fluxo de permissão de dados de saúde (tela de consentimento
     explícita, obrigatória nas guidelines da Apple/Google).
   - Web (protom.eztechin.com.br) não tem acesso a HealthKit/Health
     Connect — nesse ambiente o check-in manual continua sendo o
     caminho, mesmo depois da integração mobile existir.

4. **Privacidade / compliance**
   - Dado de saúde é sensível sob LGPD — precisa de consentimento
     explícito, política de retenção definida, e não pode ser
     reaproveitado para outros fins sem novo consentimento.

5. **Fórmula do score com dado real**
   - Definir como HRV + FC repouso + estágios de sono combinam num
     0-100 comparável ao que o questionário manual gera hoje, pra não
     quebrar a continuidade histórica do Score Metabólico do usuário.
   - Manter o check-in manual como fallback nos dias em que o
     wearable não sincronizar (dado de sensor é frequentemente
     incompleto/atrasado).

6. **Migração da interface** — ✅ feito: `MetabolicScoreDetails.wellness`
   já tem `hasCheckin` + os valores. Falta apenas, quando existir
   fonte de dispositivo, trocar `hasCheckin: boolean` por um enum de
   origem (`'none' | 'manual' | 'device'`) pra UI poder mostrar o selo
   "Apple Watch" vs. "autoavaliação".

## Achados adicionais (varredura ampla, 2026-09-09)

Pedido do usuário: "analise a aplicação e pense no que mais pode ser
feito para agora sem wearable". Rodamos uma varredura maior no app
procurando qualquer lugar que mostra número/insight/alerta como se
fosse medido/gerado por IA mas na verdade é estático. Os itens abaixo
que envolviam sono/recuperação/Apple Watch/Oura já foram corrigidos
(seção "O que foi implementado"). Os que sobraram são features
maiores, fora do escopo de "trocar por check-in manual" — ficam
documentados aqui como próximos passos, por ordem de impacto de
confiança do usuário:

1. **Upload de exames "IA extrai automaticamente"** —
   `ExamsUploadScreen` (frontend) diz "A IA extrairá os dados
   automaticamente" / "Visão Computacional (OCR) + LLM", mas o botão
   de upload não tem `onPress` nenhum (não faz nada) e o backend
   (`ExamsController.createExam`) só aceita `{name, date, type}`
   digitado à mão — não existe OCR nem LLM em lugar nenhum do módulo.
   Todo exame criado recebe `status: 'Analisado'` sem nenhuma análise
   real. **Isso é um bug funcional antes de ser um problema de dado
   fake** — o botão principal da tela não faz nada.
   Próximo passo: implementar upload real (S3/storage) + pipeline de
   OCR/LLM, ou, como intermediário honesto, trocar a tela por um
   formulário manual de resultados de exame (sem alegar IA) até o
   pipeline existir.

2. **"Processando imagem..." / "Imagem analisada com sucesso" na
   Nutrição** — `NutritionScreen` tem `analysed` hardcoded como
   `true` no mount; não existe captura de foto nem análise de
   imagem, é uma animação decorativa sobre um registro de refeição
   estático vindo de `/nutrition/last-meal`.
   Próximo passo: mesma decisão do item 1 — construir a análise de
   foto de verdade, ou remover a encenação de "processando/analisado
   por IA" e deixar claro que é registro manual.

3. **Body Scan com deltas e timestamp inventados** —
   `UsersService.getBodyScan` retorna `bodyFatDelta: -2.1`,
   `visceralFat: 12`, `weightDelta: -5.0` etc. como constantes fixas
   pra todo usuário, toda vez, com o rótulo "Comparativo: Mês 1 vs
   Mês 2". O frontend (`BodyScanScreen`) ainda soma um horário fixo
   "Hoje, 08:30 AM" do lado de uma animação de scanner a laser, como
   se um scan real tivesse acabado de acontecer.
   Próximo passo: criar uma tabela de histórico de scans (ou derivar
   de registros de peso/exame reais) e só mostrar comparativo/deltas
   quando existir um scan anterior de verdade; caso contrário, estado
   vazio ("Seu primeiro scan não tem comparativo ainda").

4. **`nextExamDays: 12` e `examsStatus: 90` hardcoded no dashboard** —
   `UsersService.getDashboard` não usa os exames reais do usuário
   (que já existem em `ExamEntity`/`ExamsService`) pra esses dois
   campos.
   Próximo passo: calcular `nextExamDays` a partir da data do último
   exame + intervalo recomendado, e `examsStatus` a partir de
   `ExamsService.getEvolution` (já existe e é real).

5. **Treino/refeição "vazios" retornam registro fake sem sinalizar** —
   `WorkoutService.getTodayWorkout` e `NutritionService.getLastMeal`
   retornam um treino/refeição completo e específico (com nome, sets,
   pesos, macros) quando o usuário não tem nada salvo, sem nenhuma
   flag de "isPlaceholder". É mais defensável que os itens acima
   (é conteúdo inicial de exemplo, não afirma ter sido medido/gerado
   por IA), mas ainda assim é indistinguível de dado real do usuário
   pro frontend.
   Próximo passo: retornar `null`/`hasData: false` e desenhar um
   estado vazio real nas telas (`WorkoutIndicationScreen`,
   `NutritionScreen`), em vez do fallback fabricado vir do backend.

## Referências usadas na pesquisa

- Questionário de bem-estar (Hooper-Mackinnon) em plataformas de
  monitoramento de atletas:
  https://www.athletemonitoring.com/wellness-monitoring/
- Uso de app de smartphone para autogestão de recuperação em atletas:
  https://www.ncbi.nlm.nih.gov/pmc/articles/PMC9053116/
- Readiness Score do Google Health (referência de produto):
  https://support.google.com/googlehealth/answer/14236710?hl=en
