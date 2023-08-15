#!/usr/bin/env node

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import removeUnusedDependencies from './index.js';

// Configuração do Yargs para processar comandos e opções da linha de comando.
yargs(hideBin(process.argv))
    .command(
        'remove',
        'Remove unused dependencies',
        () => {}, // Configuração do comando 'remove', não há argumentos extras.
        () => removeUnusedDependencies({ action: 'remove' }) // Executa a função para remover dependências não utilizadas.
    )
    .command(
        'analyze',
        'Analyze unused dependencies',
        () => {}, // Configuração do comando 'analyze', não há argumentos extras.
        () => removeUnusedDependencies({ action: 'analyze' }) // Executa a função para analisar dependências não utilizadas.
    )
    .demandCommand(1, 'You need to specify a command (remove or analyze)') // Exige a especificação de um comando válido.
    .help().argv; // Habilita a opção de ajuda e processa os argumentos da linha de comando.

// Executa a função principal para remover ou analisar dependências não utilizadas.
// O comando especificado deve ser passado como argumento na linha de comando.
// Exemplos de uso: "remove-unused-dependencies remove" ou "remove-unused-dependencies analyze".
