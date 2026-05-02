# Guia de Tradução PT-BR

## Status Atual
- **Total de cartas:** 14342
- **Traduzidas:** 12451 (86.8%)
- **Pendentes:** 1891
- **Última atualização:** 02/05/2026

## Resumo do que já foi feito

### 1. Tradução via API YGOPRODeck (COMPLETO)
- 10887 traduções PT foram baixadas da API `https://db.ygoprodeck.com/api/v7/cardinfo.php?language=pt`
- 488 cartas foram atualizadas com essas traduções
- Script: `scripts/translate-cards.js` (usado primeiro)

### 2. Tradução via MyMemory API (INTERROMPIDO - TIMEOUT)
- O script `scripts/translate-all.js` estava traduzindo as 1403 cartas restantes
- Progresso alcançado: ~56% das 1403 cartas (~786 cartas)
- **PROBLEMA:** O script foi interrompido por timeout (600s) e **não salvou o progresso intermediário**
- O arquivo `cards.json` atual tem apenas as 488 traduções da API YGOPRODeck

## Como Retomar a Tradução

### Opção 1: Usar o script existente (recomendado)
```bash
node scripts/translate-all.js
```
Este script:
1. Baixa traduções da API YGOPRODeck (rápido, ~30s)
2. Traduz as cartas restantes via MyMemory API (lento, ~30+ minutos)

**Se timeout novamente**, aumente o timeout ou divida o trabalho:

### Opção 2: Traduzir em lotes menores
Crie um script que traduz apenas um range de cartas:
```javascript
// Traduzir cartas do índice X ao Y
const needTranslation = cards.filter(...).slice(X, Y);
```

### Opção 3: Traduzir nomes primeiro, efeitos depois
Nomes são mais curtos e rápidos. Traduza todos os nomes primeiro, depois os efeitos.

## Cards que NÃO têm tradução na API YGOPRODeck
- ~1403 cartas não existem na base PT do YGOPRODeck
- São cartas mais novas, promo, ou de edições limitadas
- Precisam ser traduzidas via MyMemory ou outra API

## Cards sem ygoprodeck ID (~291)
- 291 cartas não têm ID do YGOPRODeck nos `externalIDs`
- Estas não podem ser buscadas na API YGOPRODeck
- Devem ser traduzidas via API de tradução

## Recursos Utilizados

### APIs
- **YGOPRODeck:** `https://db.ygoprodeck.com/api/v7/cardinfo.php?language=pt` (gratuita, ~10887 cartas PT)
- **MyMemory:** `https://api.mymemory.translated.net/get?q=TEXT&langpair=en|pt` (gratuita, 1000 req/dia, 500 chars/req)

### Estrutura do JSON
Cada carta tem `text.pt.name` e `text.pt.effect` que devem ser preenchidos em PT-BR.

## Comandos Úteis

```bash
# Ver quantas cartas ainda estão sem tradução
node -e "const c=require('./public/json/cards.json'); const s=c.filter(x=>x.text?.pt?.name===x.text?.en?.name); console.log(s.length)"

# Ver amostra de cartas não traduzidas
node -e "const c=require('./public/json/cards.json'); const s=c.filter(x=>x.text?.pt?.name===x.text?.en?.name); s.slice(0,5).forEach(x=>console.log(x.text.en.name))"

# Ver progresso percentual
node -e "const c=require('./public/json/cards.json'); const t=c.filter(x=>x.text?.pt?.name!==x.text?.en?.name); console.log(((t.length/c.length)*100).toFixed(1)+'%')"
```

## Notas Importantes
- Nomes próprios (ex: "Abaki", "Amabie") podem permanecer iguais em PT - isso é normal
- Nomes numéricos ou muito curtos podem não precisar de tradução
- O script pula nomes com menos de 2 caracteres
