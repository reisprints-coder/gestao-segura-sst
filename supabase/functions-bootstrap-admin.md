# Edge Function `bootstrap-admin`

A função já está publicada no projeto Supabase com o nome `bootstrap-admin`.

Ela só cria uma conta quando ainda não existe nenhum perfil no sistema. A conta é criada com e-mail confirmado e recebe o perfil `admin`. Depois da primeira criação, a função retorna conflito e não cria outras contas.
