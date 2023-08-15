import fs from 'fs/promises'; // Importa a biblioteca fs com o módulo Promises para operações assíncronas de sistema de arquivos.
import { exec } from 'child_process/promises'; // Importa a função exec do módulo child_process com suporte a Promises.
import { findUp } from 'find-up'; // Importa a função para procurar um arquivo subindo nos diretórios.
import { pathToFileURL } from 'url'; // Importa a função para criar uma URL a partir de um caminho de arquivo.

export default async function removeUnusedDependencies({ action }) {
    try {
        // Encontra o caminho para o arquivo package.json na hierarquia de diretórios.
        const packageJsonPath = await findUp('package.json', { cwd: process.cwd() });
        const packageJsonUrl = pathToFileURL(packageJsonPath).toString();
        const packageJsonModule = await import(packageJsonUrl); // Importa o conteúdo do package.json como um módulo.
        const packageJson = packageJsonModule.default; // Extrai o objeto package.json do módulo.

        // Função para encontrar todos os arquivos .js e .ts recursivamente em um diretório.
        const findAllFiles = async (dir, results = []) => {
            const list = await fs.readdir(dir);
            for (const file of list) {
                const filePath = `${dir}/${file}`;
                const stat = await fs.stat(filePath);
                if (stat.isDirectory()) {
                    await findAllFiles(filePath, results);
                } else if (file.endsWith('.js') || file.endsWith('.ts')) {
                    results.push(filePath);
                }
            }
            return results;
        };
        const files = await findAllFiles('./'); // Encontra todos os arquivos no diretório atual e subdiretórios.

        const usedPackages = new Set(); // Conjunto para armazenar pacotes usados.

        for (const file of files) {
            try {
                const content = await fs.readFile(file, 'utf8'); // Lê o conteúdo do arquivo.
                // Expressões regulares para encontrar importações e require de pacotes.
                const importRegexp = /^import\s.*?\bfrom\s['"]([^'"]+)['"]/gm;
                const requireRegexp = /^const\s.*?\s=\srequire\(['"]([^'"]+)['"]\)/gm;
                let match;
                while ((match = importRegexp.exec(content))) {
                    usedPackages.add(match[1]); // Adiciona os pacotes usados ao conjunto.
                }
                while ((match = requireRegexp.exec(content))) {
                    usedPackages.add(match[1]); // Adiciona os pacotes usados ao conjunto.
                }
            } catch (e) {
                console.error(`Error reading file: ${file}`, e);
            }
        }

        // Função para filtrar as dependências não utilizadas.
        const filterDependencies = (deps) => {
            if (!deps) return {};

            const newDeps = {};
            const unusedDeps = {};

            for (const dep in deps) {
                if (usedPackages.has(dep)) {
                    newDeps[dep] = deps[dep];
                } else {
                    unusedDeps[dep] = deps[dep];
                }
            }

            return {
                newDeps,
                unusedDeps
            };
        };

        // Filtra as dependências e obtém as não utilizadas.
        const { unusedDeps: unusedDeps1, ...filteredDependencies } = filterDependencies(packageJson.dependencies);
        packageJson.dependencies = filteredDependencies;

        const { unusedDeps: unusedDeps2, ...filteredDevDependencies } = filterDependencies(packageJson.devDependencies);
        packageJson.devDependencies = filteredDevDependencies;

        if (action === 'remove') {
            // Remove as dependências não utilizadas.
            await removeDependencies(Object.keys(unusedDeps1), 'Uninstalling unused dependencies...');
            await removeDependencies(Object.keys(unusedDeps2), 'Uninstalling unused devDependencies...');
        } else if (action === 'analyze') {
            console.log('\x1b[32m', 'Unused dependencies:', unusedDeps1);
            console.log('\x1b[32m', 'Unused devDependencies:', unusedDeps2);
        } else {
            console.log('\x1b[32m', 'Nothing to remove!');
        }
    } catch (error) {
        console.error('An error occurred:', error);
    }
}

async function removeDependencies(dependencies, message) {
    if (dependencies.length > 0) {
        const command = `npm uninstall ${dependencies.join(' ')}`; // Cria o comando para desinstalar dependências.
        console.log('\x1b[31m', message); // Imprime uma mensagem de status em vermelho.
        try {
            const { stdout, stderr } = await exec(command); // Executa o comando de desinstalação.
            console.log('\x1b[32m', 'Done!'); // Imprime uma mensagem de conclusão em verde.
        } catch (error) {
            console.error('Error while uninstalling dependencies:', error); // Lida com erros na desinstalação.
        }
    }
}

removeUnusedDependencies({ action: 'analyze' });  // Você pode substituir 'analyze' por 'remove' ou qualquer outra ação.
