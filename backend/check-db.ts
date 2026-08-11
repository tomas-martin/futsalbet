import prisma from './src/config/database';

async function main() {
  const matches = await prisma.match.count();
  const teams = await prisma.team.count();
  const tournaments = await prisma.tournament.count();
  const users = await prisma.user.count();
  console.log('✅ Conectado a Supabase');
  console.log(`📊 Matches: ${matches}`);
  console.log(`🏟️  Equipos: ${teams}`);
  console.log(`🏆 Torneos: ${tournaments}`);
  console.log(`👤 Usuarios: ${users}`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error('❌ Error conectando a Supabase:', e.message);
  process.exit(1);
});
