import { IncrementSecret } from './IncrementSecret.js';
import { Field, Mina, PrivateKey, AccountUpdate } from 'o1js';
import PCAPNGParser from 'pcap-ng-parser';
import fs from 'fs';
import path from 'path';

const pcapFilePath = path.join('C:', 'Users', 'user', 'Desktop', 'new.pcapng');
const packetDataList: string[] = [];

interface Packet {
  data: Buffer;
  timestampHigh: number;
  timestampLow: number;
}

function analyzePacket(packet: Packet): void {
  try {
    const { data, timestampHigh, timestampLow } = packet;
    const timestamp = new Date((timestampHigh * 2 ** 32 + timestampLow) / 1000);

    if (data.length < 14) return;
    const ethType = data.readUInt16BE(12);
    if (ethType !== 0x0800) return;

    if (data.length < 34) return;
    const ipHeaderStart = 14;
    const ipHeader = data.slice(ipHeaderStart, ipHeaderStart + 20);

    const srcIp = Array.from(ipHeader.slice(12, 16)).map(byte => byte.toString(10)).join('.');
    const dstIp = Array.from(ipHeader.slice(16, 20)).map(byte => byte.toString(10)).join('.');

    const protocol = ipHeader[9];
    let srcPort: number | string = 'Unknown', dstPort: number | string = 'Unknown';
    if (protocol === 6 && data.length >= ipHeaderStart + 34) {
      srcPort = data.readUInt16BE(ipHeaderStart + 20);
      dstPort = data.readUInt16BE(ipHeaderStart + 22);
    } else if (protocol === 17 && data.length >= ipHeaderStart + 28) {
      srcPort = data.readUInt16BE(ipHeaderStart + 20);
      dstPort = data.readUInt16BE(ipHeaderStart + 22);
    }

    if (dstPort == 443){
        packetDataList.push(`Time: ${timestamp.toISOString()}, Source IP: ${srcIp}, Destination IP: ${dstIp}, Source Port: ${srcPort}, Destination Port: ${dstPort}`);
    }
  } catch (error) {
    console.error('Error analyzing packet:', error);
  }
}

async function analyzePCAP(): Promise<void> {
  return new Promise((resolve, reject) => {
    console.log(`Starting PCAP analysis of file: ${pcapFilePath}`);
    
    if (!fs.existsSync(pcapFilePath)) {
      reject(new Error(`PCAP file not found: ${pcapFilePath}`));
      return;
    }

    const pcapNgParser = new PCAPNGParser();
    const myFileStream = fs.createReadStream(pcapFilePath);

    pcapNgParser.on('data', (packet: Packet) => {
      analyzePacket(packet);
      if (packetDataList.length % 100 === 0) {
        console.log(packetDataList)
      }
    });

    pcapNgParser.on('end', () => {
      console.log(`PCAP analysis complete. Total packets: ${packetDataList.length}`);
      resolve();
    });

    pcapNgParser.on('error', (error) => {
      console.error('Error during PCAP parsing:', error);
      reject(error);
    });

    myFileStream.on('error', (error) => {
      console.error('Error reading PCAP file:', error);
      reject(error);
    });

    myFileStream.pipe(pcapNgParser);
  });
}

async function runMinaOperations() {
  console.log('Starting blockchain operations');

  const useProof = false;
  const Local = await Mina.LocalBlockchain({ proofsEnabled: useProof });
  Mina.setActiveInstance(Local);
  const deployerAccount = Local.testAccounts[0];
  const deployerKey = deployerAccount.key;
  const senderAccount = Local.testAccounts[1];
  const senderKey = senderAccount.key;

  const salt = Field.random();

  const zkAppPrivateKey = PrivateKey.random();
  const zkAppAddress = zkAppPrivateKey.toPublicKey();

  const zkAppInstance = new IncrementSecret(zkAppAddress);
  console.log('Deploying zkApp...');
  const deployTxn = await Mina.transaction(deployerAccount, async () => {
    AccountUpdate.fundNewAccount(deployerAccount);
    await zkAppInstance.deploy();
    await zkAppInstance.initState(salt, Field(750));
  });
  await deployTxn.prove();
  await deployTxn.sign([deployerKey, zkAppPrivateKey]).send();

  const num0 = zkAppInstance.x.get();
  console.log('State after init:', num0.toString());

  console.log('Incrementing secret...');
  const txn1 = await Mina.transaction(senderAccount, async () => {
    await zkAppInstance.incrementSecret(salt, Field(750));
  });
  await txn1.prove();
  await txn1.sign([senderKey]).send();

  const num1 = zkAppInstance.x.get();
  console.log('State after txn1:', num1.toString());
  
  console.log('Blockchain operations completed');
}

async function main() {
  try {
    console.log('Starting main function');
    await analyzePCAP();

    console.log(`Total packets processed: ${packetDataList.length}`);
    if (packetDataList.length > 0) {
      console.log('First packet:', packetDataList[0]);
      console.log('Last packet:', packetDataList[packetDataList.length - 1]);
    } else {
      console.log('No packets were processed');
    }

    console.log(packetDataList)
    await runMinaOperations();

    console.log('Main function completed successfully');
  } catch (error) {
    console.error("An error occurred in main:", error);
  }
}

console.log('Script started');
main().then(() => {
  console.log('Script finished');
  process.exit(0);
}).catch(error => {
  console.error('Unhandled error in main:', error);
  process.exit(1);
});