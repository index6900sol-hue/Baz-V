const { runAutonomousFundManager } = require('../lib/fundManagerV2');

const intervalMinutes = Number(process.env.WORKER_INTERVAL_MINUTES ?? 60);  // Default: hourly
const intervalMs = Math.max(5, intervalMinutes) * 60 * 1000;

async function main() {
  console.log('═══════════════════════════════════════════');
  console.log('🤖 BAZ AUTONOMOUS FUND MANAGER WORKER');
  console.log('═══════════════════════════════════════════');
  console.log(`🚀 Worker started at ${new Date().toISOString()}`);
  console.log(`⏱️  Trading cycle interval: ${intervalMinutes} minutes`);
  console.log(`📍 Running mode: AUTONOMOUS TRADING`);
  console.log('═══════════════════════════════════════════\n');

  let cycleCount = 0;

  while (true) {
    cycleCount++;
    const cycleStartTime = new Date();
    
    try {
      console.log(`\n${'─'.repeat(60)}`);
      console.log(`📊 CYCLE #${cycleCount} | ${cycleStartTime.toISOString()}`);
      console.log(`${'─'.repeat(60)}`);
      
      const result = await runAutonomousFundManager();
      
      const duration = (new Date() - cycleStartTime) / 1000;
      console.log(`\n✅ CYCLE #${cycleCount} COMPLETED`);
      console.log(`   Duration: ${duration.toFixed(2)}s`);
      console.log(`   Portfolio Value: $${result.portfolio.totalUsd.toFixed(2)}`);
      console.log(`   Trades Executed: ${result.stats.tradesExecuted}/${result.stats.totalTrades}`);
      console.log(`   AI Engine: ${result.aiRecommendation.source}`);
      console.log(`   Assets Screened: ${result.stats.assetsScreened}/${result.stats.assetsDiscovered}`);
      
      if (result.stats.tradesExecuted > 0) {
        console.log(`   💰 Bought: $${result.stats.totalBought.toFixed(2)}`);
        console.log(`   💰 Sold: $${result.stats.totalSold.toFixed(2)}`);
      }
      
    } catch (error) {
      console.error(`\n❌ CYCLE #${cycleCount} FAILED`);
      console.error(`   Error: ${error.message}`);
      console.error(`   Stack: ${error.stack}`);
    }

    const waitTime = intervalMs / 1000 / 60;
    console.log(`\n⏳ Next cycle in ${waitTime} minutes (${new Date(Date.now() + intervalMs).toISOString()})`);
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
}

main().catch((error) => {
  console.error('\n🔴 WORKER CRASH');
  console.error(error);
  process.exit(1);
});
