# Sistema de Ônibus — Demo

Demonstração pública e independente de uma interface para consulta de linhas, bairros e horários de ônibus.

## Demonstração online

**[Abrir o sistema](https://sistema-onibus-taina.tainalopesgpl.chatgpt.site)**

> Todos os nomes, linhas, horários, bairros e avisos são fictícios. Este projeto não possui vínculo com prefeitura, empresa de transporte ou órgão público e não deve ser usado para planejar viagens reais.

## Funcionalidades

- Página inicial responsiva
- Busca por número da linha, bairro ou destino
- Filtro de linhas por região
- Consulta de horários por tipo de dia
- Avisos demonstrativos por linha
- Navegação acessível e adaptada para celular
- Funcionamento local, sem cadastro e sem coleta de dados

## Segurança da demonstração

Este repositório contém somente a interface pública sanitizada. Não há painel administrativo, banco de dados, autenticação, credenciais, integrações privadas ou APIs externas.

## Tecnologias

- HTML5 semântico
- CSS3 responsivo
- JavaScript
- Worker ESM para hospedagem
- Testes com Node.js

## Executar localmente

```bash
npm test
npm run build
```

O build gera um Worker autocontido em `dist/server/index.js`.

## Licença

Distribuído sob a [Licença MIT](LICENSE).

## Autor

Desenvolvido por [Tainã Lopes](https://github.com/TainamGpl).

