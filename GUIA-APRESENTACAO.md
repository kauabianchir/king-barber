# King Barber - roteiro de apresentação

O sistema permite que o cliente reserve um serviço em quatro etapas. O barbeiro acompanha a agenda, confirma o sinal e consulta o financeiro. A aplicação atende uma barbearia.

## Como o projeto está organizado

| Arquivo | Responsabilidade |
| --- | --- |
| `main.tsx` | Inicia o React e acompanha a sessão da conta. |
| `AuthPanel.tsx` | Formulários de entrada, cadastro e recuperação de senha. |
| `App.tsx` | Navegação entre telas, dados carregados e etapas do agendamento. |
| `BookingCard.tsx` | Mostra um atendimento e seus botões de ação. |
| `ServiceForm.tsx` | Permite ao administrador alterar preços e disponibilidade. |
| `ValidatedForm.tsx` | Verifica os campos antes do envio, destaca erros e posiciona o foco. |
| `WeeklyCalendar.tsx` | Apresenta os atendimentos na semana. |
| `SundayPicker.tsx` | Mostra os domingos para o Dia do Noivo. |
| `FinanceArrows.tsx` | Compara os indicadores financeiros com setas. |
| `NotificationsBell.tsx` | Exibe notificações e permite marcá-las como lidas. |
| `PromoCard.tsx` | Apresenta serviços, combo e novidades. |
| `ThemeToggle.tsx` | Alterna o tema e guarda a preferência no navegador. |
| `formatters.ts` | Formata dinheiro, datas e horários. |
| `types.ts` | Define os campos de serviços, reservas e despesas usados pela interface. |
| `api.ts` | Envia as operações ao Supabase usando a sessão da conta. |
| `database.sql` | Estrutura do banco, permissões e regras das operações. |
| `styles.css` | Estilos da interface e dos dois temas. |

## Principais funções

`loadData`, em `App.tsx`, consulta os dados da conta. A consulta também ocorre a cada 30 segundos para atualizar agenda e notificações.

`loadAvailableSlots` consulta os horários do serviço e da data escolhidos. Quando a seleção muda, a resposta da consulta anterior é ignorada. Depois de uma reserva ou cancelamento, os horários são consultados novamente.

`handleAction` envia uma operação, apresenta o resultado e atualiza os dados. Enquanto a operação acontece, os botões usam o estado `busy` para impedir cliques repetidos.

`handleSubmit`, em `AuthPanel.tsx`, trata entrada, cadastro e recuperação. Em `ValidatedForm.tsx`, a função com o mesmo nome verifica os campos do formulário antes de chamar a operação.

`financialRange` valida as datas do financeiro. `summarize` soma os serviços concluídos e as despesas do período. `deposit` calcula o sinal de 25%.

`sundaysInMonth` percorre os dias do mês e retorna os domingos. `calendarEvent` converte o início e a duração de uma reserva em posição e tamanho no calendário.

## Regras para explicar

- Corte: 60 minutos; corte e barba: 90 minutos; Dia do Noivo: duração configurável e atendimento aos domingos.
- Os inícios seguem intervalos de 30 minutos. A duração inteira precisa estar livre e terminar até as 20h.
- A reserva comum exige duas horas de antecedência e pode ser feita com até 90 dias de antecedência.
- O sinal corresponde a 25% do preço. Ele é descontado do total e confirmado manualmente pelo barbeiro.
- O cliente acessa suas reservas. O administrador controla agenda completa, serviços e despesas.
- Uma reserva sem sinal é expirada na próxima consulta ao servidor quando restam duas horas ou menos para o atendimento.
- O faturamento considera serviços concluídos. O sinal não é somado novamente. Lucro é faturamento menos despesas ativas.
- A exclusão de despesas é reversível. Um lançamento excluído sai dos totais e pode ser restaurado.

## Demonstração sugerida

1. Entrar no sistema e escolher um serviço. Mostrar preço, duração e sinal.
2. Consultar uma data e escolher o horário.
3. Tentar avançar com dados vazios; depois preencher e revisar a reserva.
4. Mostrar a agenda semanal e a legenda das cores.
5. Selecionar Dia do Noivo e mostrar o seletor de domingos.
6. Apresentar o financeiro, os filtros e a exclusão/restauração de despesas com dados de teste.
7. Abrir as notificações e alternar entre os temas.
8. Mostrar o PR e a execução da CI no GitHub.

## Perguntas comuns

**Por que validar no navegador e no banco?** O navegador orienta o preenchimento. O banco protege as regras mesmo quando uma requisição não vem do formulário.

**Como impedir dois clientes no mesmo horário?** Cada intervalo ocupado tem uma chave única. A reserva e os intervalos são gravados na mesma transação. Um conflito impede a gravação parcial.

**Por que o dinheiro fica em centavos?** Os valores são armazenados como números inteiros. A conversão para reais acontece na exibição.

**O Pix é automático?** Não. O sistema calcula o sinal, mas o barbeiro confirma o recebimento. Integrações de pagamento e mensagens estão fora do MVP.

**Para que serve o TypeScript?** Ele descreve os campos esperados e ajuda a encontrar erros antes de executar a aplicação.

**O que a CI faz?** Instala as dependências pelo lockfile, verifica TypeScript, executa os testes e compila a aplicação.

## Executar localmente

Com Node.js instalado, abrir a pasta do projeto e executar:

```sh
npm ci
npm run dev -- --open /source.html
```

Verificações:

```sh
npm run check
npm test
npm run build
```

O banco local usado nos testes é isolado. A aplicação publicada usa o projeto Supabase configurado em `config.ts`.
