# Revisão dos testes de aceite

Este PR integra cinco cenários que já foram executados na conferência do projeto ao comando `npm test`. O banco é criado em memória pelo PGlite; os testes não usam a conta ou o banco publicado.

## O que conferir

- A reserva guarda o sinal de 25%, a confirmação exige administração e o cancelamento libera o horário.
- Alterar um serviço preserva preço e duração de uma reserva existente.
- Somente o administrador conclui ou registra falta; estados finais não reabrem.
- A receita usa apenas serviços concluídos e não soma o sinal duas vezes; excluir e restaurar uma despesa atualiza o resultado sem duplicação.
- O cliente recebe os avisos das suas reservas e a leitura fica registrada.

## Como executar

Na pasta do projeto, com Node 22 ou superior:

```sh
npm ci
npm run check
npm test
npm run build
```

Resultado esperado: 31 testes de domínio/calendário, 24 de Postgres/PGlite e 5 cenários de aceite, totalizando 60 verificações. O relatório adicional é salvo em `acceptance-test-results.json`.

## Como registrar a revisão

Leia o arquivo de testes e confira a execução. No PR, registre o que verificou e qualquer dúvida ou correção necessária. Use Request changes quando houver problema e Approve somente quando a revisão estiver concluída. Não copie uma declaração de aprovação antes de revisar.
