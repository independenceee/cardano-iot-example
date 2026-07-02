import { BlockfrostProvider, MeshWallet } from "@meshsdk/core";
import { SensorContract } from "../scripts";
import { readDHT22 } from "../sensor";
import * as dotenv from "dotenv";
dotenv.config();

let provider: BlockfrostProvider = new BlockfrostProvider(process.env.BLOCKFROST_API_KEY || "");
let wallet = new MeshWallet({
  networkId: 0,
  fetcher: provider,
  submitter: provider,
  key: {
    type: 'mnemonic',
    words: process.env.MNEMONIC?.split(' ') || [],
  },
});

export const writeDataToContract = async () => {
  const timestamp = new Date().toLocaleString();
  
  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║       📤 BLOCKCHAIN TRANSACTION - WRITE DATA           ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log(`⏰ Time: ${timestamp}\n`);
  
  // Read sensor data
  console.log('📡 Step 1/5: Reading sensor data...');
  const sensorData = await readDHT22();

  if (
    !sensorData ||
    typeof sensorData.temperature !== 'number' ||
    typeof sensorData.humidity !== 'number' ||
    Number.isNaN(sensorData.temperature) ||
    Number.isNaN(sensorData.humidity)
  ) {
    console.error('❌ ERROR: No valid sensor data available');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    return;
  }
  
  console.log('   ✓ Temperature:', sensorData.temperature.toFixed(1) + '°C');
  console.log('   ✓ Humidity:', sensorData.humidity.toFixed(1) + '%\n');
  
  // Prepare data for blockchain
  const tempOnChain = Math.round(sensorData.temperature * 1000);
  const humidityOnChain = Math.round(sensorData.humidity * 1000);
  const sensorName = 'dht22_sensor_01';
  
  console.log('🔨 Step 2/5: Building transaction...');
  console.log('   • Sensor Name:', sensorName);
  console.log('   • Temperature (on-chain):', tempOnChain, `(${sensorData.temperature.toFixed(1)}°C × 1000)`);
  console.log('   • Humidity (on-chain):', humidityOnChain, `(${sensorData.humidity.toFixed(1)}% × 1000)\n`);
  
  try {
    const sensorContract: SensorContract =
      new SensorContract({ wallet: wallet, provider: provider });
    
    const unsignedTx: string = await sensorContract.write({
      sensorName,
      temperature: tempOnChain,
      humidity: humidityOnChain,
    });
    
    console.log('   ✓ Transaction built successfully\n');
    
    // Sign transaction
    console.log('✍️  Step 3/5: Signing transaction...');
    const signedTx = await wallet.signTx(unsignedTx, true);
    console.log('   ✓ Transaction signed\n');
    
    // Submit to blockchain
    console.log('📤 Step 4/5: Submitting to Cardano Preprod network...');
    const txHash = await wallet.submitTx(signedTx);
    console.log('   ✓ Transaction submitted!\n');
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔗 Transaction Hash:');
    console.log('   ' + txHash);
    console.log('\n🌐 View on Explorer:');
    console.log('   https://preprod.cexplorer.io/tx/' + txHash);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    // Wait for confirmation
    console.log('⏳ Step 5/5: Waiting for blockchain confirmation...');
    
    await new Promise<void>(function (resolve) {
      provider.onTxConfirmed(txHash, () => {
        console.log('   ✓ Transaction confirmed on blockchain!\n');
        console.log('✅ SUCCESS: Data written to Cardano blockchain');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        resolve();
      });
    });
    
    return txHash;
    
  } catch (error) {
    console.error('\n❌ ERROR: Transaction failed');
    console.error('   Reason:', (error as Error).message);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    throw error;
  }
}
