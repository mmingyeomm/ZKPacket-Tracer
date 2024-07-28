import { IncrementSecret } from './IncrementSecret.js';
import { Field, Mina, PrivateKey, AccountUpdate } from 'o1js';
import fs from 'fs';
import readline from 'readline';
import path from 'path';

async function readFileLineByLine(filePath: string): Promise<void> {
    try {
        // Normalize the file path
        const normalizedPath = path.normalize(filePath.replace(/"/g, ''));

        // Create a read stream for the file
        const fileStream = fs.createReadStream(normalizedPath);

        // Create a readline interface
        const rl = readline.createInterface({
            input: fileStream,
            crlfDelay: Infinity
        });

        // Read and print each line
        for await (const line of rl) {
            console.log(line);
        }

        console.log('File reading completed.');
    } catch (error) {
        console.error('Error reading file:', error);
    }
}

// Example usage
const filePath = "C:\\Users\\user\\Desktop\\proof.txt";
readFileLineByLine(filePath);


const useProof = false;

const Local = await Mina.LocalBlockchain({ proofsEnabled: useProof });
Mina.setActiveInstance(Local);
const deployerAccount = Local.testAccounts[0];
const deployerKey = deployerAccount.key;
const senderAccount = Local.testAccounts[1];
const senderKey = senderAccount.key;

const salt = Field.random();

// ----------------------------------------------------

// create a destination we will deploy the smart contract to
const zkAppPrivateKey = PrivateKey.random();
const zkAppAddress = zkAppPrivateKey.toPublicKey();

const zkAppInstance = new IncrementSecret(zkAppAddress);
const deployTxn = await Mina.transaction(deployerAccount, async () => {
  AccountUpdate.fundNewAccount(deployerAccount);
  await zkAppInstance.deploy();
  await zkAppInstance.initState(salt, Field(750));
});
await deployTxn.prove();
await deployTxn.sign([deployerKey, zkAppPrivateKey]).send();

// get the initial state of IncrementSecret after deployment
const num0 = zkAppInstance.x.get();
console.log('state after init:', num0.toString());

// ----------------------------------------------------

const txn1 = await Mina.transaction(senderAccount, async () => {
  await zkAppInstance.incrementSecret(salt, Field(750));
});
await txn1.prove();
await txn1.sign([senderKey]).send();

const num1 = zkAppInstance.x.get();
console.log('state after txn1:', num1.toString());