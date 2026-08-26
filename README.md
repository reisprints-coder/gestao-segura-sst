# Gestão Segura SST

Site app independente para controle de saúde, segurança e apoio operacional.

## Módulos da primeira versão

- Funcionários e situação funcional
- Estoque, validade de CA e entrega de EPI
- Cursos, certificados e vencimentos
- Empilhadeiras, checklist e ordens de manutenção
- DDS, programação e participação
- Dashboard, alertas automáticos, auditoria e exportação CSV
- Layout responsivo, tema claro/escuro e instalação como PWA

## Primeiro acesso

No primeiro acesso, use **Primeiro acesso: criar administrador**. O primeiro usuário criado pela função segura `bootstrap-admin` recebe automaticamente o perfil de administrador e já entra com o e-mail confirmado. Não existe senha padrão fixa.

## Executar localmente

Abra `index.html` diretamente ou execute um servidor estático:

```bash
python -m http.server 8080
```

Depois acesse `http://localhost:8080`.

## Supabase

O sistema está conectado ao projeto Supabase `cdklivezkqkacoopoyhz`, com autenticação, banco relacional, RLS e buckets privados.

Passos:

A URL e a chave publicável ficam em `config.js`. Chaves administrativas nunca devem ser colocadas no navegador.

## Estrutura

```text
index.html
styles.css
app.js
manifest.webmanifest
service-worker.js
supabase/schema.sql
supabase/migrations/
.github/workflows/pages.yml
config.js
vercel.json
```

## Segurança prevista

- Perfis: administrador, gestor, almoxarifado, manutenção, colaborador e visualizador
- RLS por usuário autenticado e função
- Exclusão lógica para registros operacionais
- Auditoria de criação, edição e mudança de status
- Arquivos privados com acesso por usuário autenticado

## Publicação

O workflow `.github/workflows/pages.yml` publica automaticamente a branch `main` no GitHub Pages.


## Publicação assistida no Windows

Execute `PUBLICAR_NO_GITHUB.bat`. O script clona o repositório, substitui os arquivos, cria o commit e envia para a branch `main`.
