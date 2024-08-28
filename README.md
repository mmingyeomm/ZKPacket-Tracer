# ZK Packet Tracer

ZK Packet Tracer is a privacy-preserving network activity verification tool that uses Zero-Knowledge proofs to demonstrate specific properties of packet logs without revealing sensitive information.

## Project Overview

ZK Packet Tracer functions similarly to Wireshark on a local machine but addresses privacy concerns through a Zero-Knowledge (ZK) approach. It aims to enhance online monitoring capabilities while preserving user privacy.

### Key Features

- Local packet tracing and logging
- Conversion of logs to pcap files
- Parsing of pcap files
- Generation of ZK-SNARK proofs
- On-chain verification of proofs

### Use Cases

- Online examinations
- Coding tests
- Gaming (detecting cheating or use of hacks)
- Any scenario requiring secure, privacy-preserving monitoring

## Architecture
![image](https://github.com/user-attachments/assets/f3ed64ef-91e0-4550-9920-e40d5a9f8483)


The system is divided into two main components:

### Local Action

1. User traces local packets and logs them
2. Logs are converted into pcap files
3. Pcap files are parsed
4. Parsed strings are converted into circuit strings
5. Circuit strings are sent as parameters to the Prover Smart Contract
6. Prover generates a ZK-SNARK proof

### On-Chain Action

1. Generated ZK-SNARK proof is sent to the On-chain Verifier
2. Verifier confirms if the statement is true or false

## Technical Stack

- MINA blockchain for decentralized verification
- ZK-SNARKs for privacy-preserving proofs

## Future Plans

- Expand support for more detailed local packet analysis
- Implement game hack detection
- Integration with popular coding test platforms

## Contributing

We welcome contributions to the ZK Packet Tracer project. Please read our contributing guidelines before submitting pull requests.

## License

[Insert appropriate license information here]

## Contact

[Insert contact information or links to project communication channels]

