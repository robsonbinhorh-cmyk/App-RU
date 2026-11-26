# RU UFPE — colocar no ar (sem Bolt)

O servidor (Supabase, projeto "ru-ufpe") já está pronto. Falta só publicar o site.

1. Extraia este ZIP no computador. Vai aparecer a pasta `ru-ufpe`.
2. No GitHub, abra o repositório `App-RU` > "Add file" > "Upload files".
3. Abra a pasta `ru-ufpe`, selecione TUDO que está dentro (não a pasta em si) e arraste para o GitHub.
   Se não aparecer o arquivo `.gitignore`, não tem problema. O `netlify.toml` precisa ir.
4. Clique em "Commit changes".
5. No Netlify: "Add new project" > "Import an existing project" > GitHub > escolha `App-RU` > Deploy.
6. Avise o Claude. Ele configura as chaves do servidor no Netlify e você clica em "Trigger deploy".
7. Abra o endereço do site no Chrome do celular e instale pelo menu ("Instalar app").
