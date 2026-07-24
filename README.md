# Gestão Segura SST

Site app independente para controle de saúde, segurança e apoio operacional.

## Módulos da primeira versão

- Funcionários e situação funcional
- Estoque, validade de CA e entrega de EPI
- Cursos, certificados e vencimentos
- Gastos, aprovações e orçamento
- Empilhadeiras, checklist e ordens de manutenção
- DDS, programação e participação
- Dashboard, alertas automáticos, auditoria e exportação CSV
- Layout responsivo, tema claro/escuro e instalação como PWA

## Acesso demonstrativo

- E-mail: `admin@gestaosegura.local`
- Senha: `admin123`

A demonstração persiste dados no `localStorage` do navegador. Ela permite validar imediatamente os fluxos principais sem depender de serviço externo.

## Executar localmente

Abra `index.html` diretamente ou execute um servidor estático:

```bash
python -m http.server 8080
```

Depois acesse `http://localhost:8080`.

## Supabase

O arquivo `supabase/schema.sql` contém o modelo relacional, funções auxiliares, índices, gatilhos e políticas RLS para transformar a demonstração em aplicação multiusuário.

Passos:

1. Criar um projeto Supabase na região `sa-east-1`.
2. Executar `supabase/schema.sql` no SQL Editor.
3. Criar os buckets privados `certificates`, `expenses`, `epi-terms` e `maintenance`.
4. Configurar autenticação por e-mail.
5. Informar URL e chave pública no ambiente de publicação.
6. Substituir o adaptador de `localStorage` do `app.js` pelas consultas Supabase.

## Estrutura

```text
index.html
styles.css
app.js
manifest.webmanifest
service-worker.js
supabase/schema.sql
vercel.json
```

## Segurança prevista

- Perfis: administrador, gestor, almoxarifado, manutenção, colaborador e visualizador
- RLS por usuário autenticado e função
- Exclusão lógica para registros operacionais
- Auditoria de criação, edição e mudança de status
- Arquivos privados com acesso por usuário autenticado

## Próximas etapas recomendadas

1. Ativar o projeto Supabase e integrar autenticação real.
2. Migrar a persistência local para consultas ao banco.
3. Implantar assinatura digital dos termos de EPI e listas de DDS.
4. Gerar PDFs padronizados.
5. Publicar em domínio definitivo e configurar rotina de backup.
