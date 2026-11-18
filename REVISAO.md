# Revisão e aceite - King Barber

Revisão técnica: inspeção de código e execução de testes. Revisão independente por outro integrante da squad: ainda não registrada.

## Alteração para revisar

Ao apagar uma data do período, o financeiro podia produzir uma média inválida. Agora datas vazias, inexistentes ou invertidas interrompem o cálculo e exibem uma orientação. O período conta os dois extremos, inclusive anos bissextos. A alteração está em App.tsx, rules.mjs e rules.test.mjs. Os arquivos index.html e app-*.js acompanham o build do GitHub Pages.

## Itens de revisão da squad

- Conferir financialRange: datas reais, ordem e contagem inclusiva em dias.
- Conferir que o painel não mostra valores calculados para um período inválido.
- Conferir os três novos testes e executar npm ci, npm run check, npm test e npm run build.
- No PR, registrar o que foi inspecionado, apontamentos concretos e o resultado da nova verificação. Aprovar somente após verificar.
- Registrar o nome do revisor e o link da revisão. Não preencher como concluída antecipadamente.

## Roteiro de aceite funcional

Usar contas separadas de cliente e administrador. Utilizar apenas dados sintéticos claramente identificados. Não confirmar recebimento de pagamento real sem verificá-lo.

1. Cliente autenticado: consultar serviços; conferir preço, duração e sinal de 25% (corte R$ 12,50; combo R$ 18,75; noivo R$ 87,50 com os preços atuais).
2. Tentar avançar sem nome, celular e nascimento. Esperado: campos obrigatórios destacados em vermelho e envio bloqueado.
3. Reservar horário futuro com antecedência mínima de duas horas. Esperado: reserva pendente e notificação.
4. Tentar reservar o mesmo intervalo em outra conta. Esperado: bloqueio do conflito para toda a duração, sem reserva parcial.
5. Cliente deve ver e cancelar somente suas reservas. Não deve ver agenda completa, despesas nem controles administrativos.
6. Administrador: verificar agenda semanal e cores (confirmado vermelho; pendente amarelo; livre verde; concluído azul).
7. Confirmar um sinal simulado identificado como teste, depois cancelar a reserva para liberar a ocupação. Registrar resultado e manter identificação do teste no histórico.
8. Selecionar Dia do Noivo. Esperado: somente domingos no seletor do mês; trocar mês; consultar horários que caibam antes das 20h.
9. Registrar despesa sintética, excluir e restaurar. Esperado: totais recalculados, exclusão recuperável e notificações; cliente não pode executar essas operações.
10. Financeiro: testar intervalo válido, mesmo dia, datas apagadas e intervalo invertido. Esperado no PR: não exibir média inválida.
11. Alternar temas; recarregar. Esperado: preferência preservada e textos legíveis.
12. Criar conta e confirmar e-mail; testar saída, entrada e recuperação de acesso com o próprio e-mail.

Registrar para cada caso: data/hora, executor, resultado observado, link/print, falha encontrada, correção e nova execução. Os testes automatizados de banco usam identidades sintéticas locais e não comprovam, sozinhos, a aprovação deste roteiro por dois usuários reais.

## Definition of Done

- Critérios de aceite conferidos.
- Regras e autorização verificadas no servidor.
- Testes, tipagem e compilação aprovados.
- Revisão de outro integrante registrada no PR.
- Alteração integrada e publicação verificada.
- Documentação, Jira e evidências atualizados.

Somente então marcar a história como Concluída.

## Ajustes encontrados na inspeção técnica

- Validar o período financeiro antes de renderizar valores.
- Disponibilizar saída da conta no cabeçalho em telas pequenas.
- Considerar a duração do serviço ao invalidar a consulta de horários.
- Limpar dados exibidos quando a sessão deixa de ser válida.
- Tratar falha de saída com orientação ao usuário.
- Remover textos de bastidor da interface, preservando instruções úteis sobre pagamento manual.
- Atualizar a disponibilidade após reserva, cancelamento e atualização dos dados, preservando a seleção somente enquanto o horário continuar livre.
- Impedir solicitação quando a atualização remover o horário escolhido.
- Corrigir contraste do botão de saída na barra lateral do tema claro.

## Conferência de interface em 18/11/2026

Dez cenários aprovados no Chrome local: reserva e liberação após cancelamento; sinal em reais; persistência do tema; seletor do Dia do Noivo; período financeiro vazio; adição/exclusão/restauração de despesa; leitura de notificações; navegação semanal; cabeçalho móvel; saída da conta. Sem erros JavaScript observados. A execução usa um adaptador de dados sintéticos local; não representa um teste de gravação no Supabase hospedado. Os testes Postgres verificam separadamente as regras reais do banco em ambiente isolado.

Kauã informou em 18/11/2026 que ele e Mateus analisaram o código e o projeto nas aulas e se reuniram nos fins de semana de novembro. O relato documenta colaboração; não identifica uma aprovação formal do PR #1 nem uma revisão específica com achados atribuídos ao Mateus.

Estes apontamentos resultam da inspeção técnica. Não equivalem a uma revisão realizada por Mateus ou a uma retrospectiva da dupla.
