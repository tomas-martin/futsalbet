import { PrismaClient } from '@prisma/client';
import { DemoDataSource } from './adapters/DemoDataSource';
import { SportsDataImporter } from './importers/SportsDataImporter';

async function main() {
  const prisma = new PrismaClient();
  const adapter = new DemoDataSource();
  const importer = new SportsDataImporter(prisma, adapter);

  try {
    await importer.runImport();
  } catch (error) {
    console.error('❌ Error durante la importación:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
