# Fab Lab Acousmonium — Website V1.0

## Como abrir localmente
Abra `index.html` em um navegador atual. Também é possível servir esta pasta com um servidor estático local. Use sempre o mesmo endereço/navegador para acessar o catálogo salvo.

## Estrutura dos arquivos
- `index.html`: página, navegação, formulários e modais.
- `styles.css`: identidade visual e responsividade.
- `script.js`: catálogo, persistência, administração e interações.
- `assets/logo/`: logo institucional.
- `assets/machines/`: imagens locais de equipamentos.

## Como trocar o logo
Coloque a imagem em `assets/logo/fablab-acousmonium.png` e defina `APP_CONFIG.logoPath` como esse caminho em `script.js`. Enquanto não houver logo, mantenha o valor vazio para usar a marca textual temporária.

## Como trocar as cores
Edite as variáveis em `:root`, no início de `styles.css`.

## Como cadastrar máquinas
Clique em **+ Adicionar máquina**, preencha nome, categoria e descrição e salve. Informe uma URL ou caminho como `assets/machines/equipamento.jpg` para a imagem; imagens ausentes recebem placeholder. Escreva uma especificação por linha. Use **Editar**, **Ver detalhes** ou a lixeira em cada equipamento. Excluir exige confirmação.

## Como resetar os dados demonstrativos
No console do navegador, execute `localStorage.removeItem('fablab-acousmonium-machines')` e recarregue a página. Isso descarta o catálogo local e restaura os cinco exemplos. Um catálogo vazio salvo permanece vazio após recarregar.

## Limitações da V1
Dados salvos apenas no navegador atual, sem sincronização, backend ou autenticação. Limpar os dados do navegador remove o catálogo. O armazenamento pode ser bloqueado pelo navegador, especialmente em navegação privada ou arquivos locais; nesse caso, a interface informa a falha. Imagens usam URL/caminho, sem upload. Formulário de contato demonstrativo, sem envio. A fonte Exo 2 depende de internet; Arial é o fallback.

## Preparação prevista para V2
`APP_CONFIG.isAdmin` controla a administração e está habilitado nesta V1; não constitui segurança. Alterar para `false` oculta controles e impede as operações administrativas na interface. Persistência concentrada em `getMachines()` e `saveMachines()`, com funções separadas de cadastro, edição e exclusão. Essa separação permite futura integração com autenticação, permissões, API, banco de dados e armazenamento de imagens. Nenhuma dessas funções da V2 foi implementada.
