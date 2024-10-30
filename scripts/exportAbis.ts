import fs from 'fs';
import path from 'path';

async function exportAbis() {
  // Carpeta de compilación de Hardhat
  const artifactsDir = path.join(__dirname, '../artifacts/contracts');

  // Carpeta de destino para almacenar las ABIs en el frontend
  const outputDir = path.join(__dirname, '../frontend/src/abis');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Contratos que quieres exportar
  const contracts = [
    'CollectionManager',
    'MyERC721Collection',
    'MyERC1155Collection',
    'NFTMarketplace',
    'NFTStaking',
    'RewardToken',
  ];

  for (const contractName of contracts) {
    // Ruta del archivo ABI en Hardhat
    const contractArtifact = path.join(artifactsDir, `${contractName}.sol`, `${contractName}.json`);

    try {
      const artifact = JSON.parse(fs.readFileSync(contractArtifact, 'utf8'));
      const abi = artifact.abi;

      // Guardar el ABI en el archivo de destino en el frontend
      const outputPath = path.join(outputDir, `${contractName}.json`);
      fs.writeFileSync(outputPath, JSON.stringify(abi, null, 2));

      console.log(`ABI de ${contractName} exportada a ${outputPath}`);
    } catch (error) {
      console.error(`Error al exportar ABI de ${contractName}:`, error);
    }
  }
}

exportAbis().catch((error) => {
  console.error('Error en exportAbis:', error);
  process.exitCode = 1;
});
