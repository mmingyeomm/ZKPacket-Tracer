import { checkGuilty } from './checkGuilty.js';
import { Field, Mina, PrivateKey, AccountUpdate, CircuitString, Character, Struct } from 'o1js';
import PCAPNGParser from 'pcap-ng-parser';
import fs from 'fs';
import path from 'path';

const pcapFilePath = path.join('C:', 'Users', 'user', 'Desktop', 'none.pcapng');
const packetDataList: string[] = [];

interface Packet {
  data: Buffer;
  timestampHigh: number;
  timestampLow: number;
}

function wait(ms: any) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

let lastStoredPacket: { srcIp: string, dstIp: string, srcPort: number | string, dstPort: number | string } | null = null;
function analyzePacket(packet: Packet) {
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

    const currentPacketDetails = { srcIp, dstIp, srcPort, dstPort };

    if (dstPort === 443) {
      if (!lastStoredPacket || JSON.stringify(lastStoredPacket) !== JSON.stringify(currentPacketDetails)) {
        const formattedOutput = `${timestamp.toISOString()} | ${srcIp} | ${dstIp} | ${srcPort} | ${dstPort}`;
        packetDataList.push(formattedOutput);
        lastStoredPacket = currentPacketDetails;
      }
    }
  } catch (error) {
    console.error('Error analyzing packet:', error);
  }
}

function analyzePCAP(){
    
    console.log(`Starting PCAP analysis of file: ${pcapFilePath}`);
      
    if (!fs.existsSync(pcapFilePath)) {
        new Error(`PCAP file not found: ${pcapFilePath}`);
        return;
    }
  
    const pcapNgParser = new PCAPNGParser();
    const myFileStream = fs.createReadStream(pcapFilePath);

    pcapNgParser.on('data', async (packet: Packet) => {
        await analyzePacket(packet);
        if (packetDataList.length % 100 === 0) {
        }
    });
  
  
    myFileStream.pipe(pcapNgParser);

    return
}


function processPacketData(packetDataList: string[]): CircuitString[] {
  const destPorts = new Set<string>();

  const result = packetDataList.map(packet => {
    // Extract relevant information from the packet data
    const [time, sourceIP, destIP, sourcePort, destPort] = packet.split(', ');
    
    // Extract the destination port value
    const destPortValue = destPort.split(': ')[1];
    
    // Add the destination port to the set
    destPorts.add(destPortValue);
    
    // Check if there are multiple destination ports
    if (destPorts.size > 1) {
      throw new Error("Assertion failed: Multiple destination ports found");
    }
    
    // Create a string representation for CircuitString
    const circuitStringData = `${sourceIP.split(': ')[1]}-${destIP.split(': ')[1]}-${sourcePort.split(': ')[1]}-${destPortValue}`;
    
    // Create and return a CircuitString object
    return CircuitString.fromString(circuitStringData);
  });

  return result;
}

class Data extends Struct({x: Field, y: Field}){
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


  const zkAppPrivateKey = PrivateKey.random();
  const zkAppAddress = zkAppPrivateKey.toPublicKey();

  const zkAppInstance = new checkGuilty(zkAppAddress);
  


  const str1 = CircuitString.fromString("");
  
  const deployTxn1 = await Mina.transaction(deployerAccount, async () => {
    AccountUpdate.fundNewAccount(deployerAccount);
    await zkAppInstance.deploy();
    await zkAppInstance.assertData(str1)

  });
  await deployTxn1.prove();
  await deployTxn1.sign([deployerKey, zkAppPrivateKey]).send();

}


async function main() {
  try {
    console.log('Starting main function');
    await analyzePCAP();

    await wait(3000);

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

function stringToBytecode(input: string): Uint8Array {
  const encoder = new TextEncoder();
  return encoder.encode(input);
}