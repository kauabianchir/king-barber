# King Barber

Aplicação de agendamento e gestão de barbearia em React, TypeScript e Supabase.

## Funcionalidades

- Reserva em quatro etapas, ficha básica e sinal de 25% com confirmação manual.
- Agenda semanal com duração dos serviços, horários livres e status por cor.
- Despesas, faturamento, lucro estimado e média diária.
- Notificações persistentes e marcação de leitura.
- Modo claro/noturno, fundo verde royal e detalhes dourados.
- Autenticação por e-mail e senha, confirmação de e-mail e recuperação de acesso.
- Validação de campos no navegador e no banco; operações administrativas restritas.

## Desenvolvimento

Requisitos: Node.js 22.13 ou superior e npm.

```sh
npm ci
npm run dev -- --open /source.html
npm run check
npm test
npm run build
```

O build gera `dist/index.html`, JavaScript e CSS estáticos para GitHub Pages. `source.html` é a entrada de desenvolvimento. `config.ts` contém apenas URL e chave **publishable** do projeto. Nenhuma chave secret/service_role deve ser incluída no frontend.

## Banco e autenticação

A estrutura está em `database.sql` e na migração gerada pela CLI em `supabase/migrations/`. Aplique uma vez num projeto novo. As tabelas ficam no schema `private`, com RLS habilitado e sem acesso direto dos papéis de cliente. O único ponto público é `king_api`, um wrapper invoker para a função interna que verifica identidade, titularidade, papel e cada regra de negócio. O papel administrativo vem de `private.admins`; metadados editáveis do usuário não concedem privilégios.

Cadastre o administrador pelo formulário da aplicação e confirme o e-mail. Depois, pelo painel administrativo do banco, adicione o UUID verificado à tabela `private.admins`. Não existe autoatribuição de administrador e nenhum usuário recebe acesso administrativo apenas por informar um e-mail na interface.

Configure a Site URL e as Redirect URLs de autenticação para o endereço de publicação. A confirmação de sinal é manual e o sistema não faz cobrança automática nem envia mensagens de pagamento. Expiração de reservas pendentes é calculada no próximo acesso ao servidor, inclusive após o navegador ter sido fechado.

## Publicação

GitHub Pages serve a interface; Supabase mantém autenticação, regras e dados. Os arquivos publicados não contêm senhas. O banco local dos testes é isolado e não modifica o projeto hospedado. Os preços de combo e Dia do Noivo são exemplos ajustáveis pela administração; o Dia do Noivo é exclusivo aos domingos.

## Testes

Testes de domínio e calendário verificam duração, antecedência, funcionamento, domingo, financeiro e posicionamento semanal. Os testes Postgres executam a estrutura real em PGlite, com identidades sintéticas, verificando autorização, isolamento, ocupação única, rollback de colisões, sinais, cancelamento, despesas, notificações e expiração. Eles complementam a validação do projeto hospedado com contas reais.

Projeto acadêmico de Kauã Bianchi e Mateus Portela.
