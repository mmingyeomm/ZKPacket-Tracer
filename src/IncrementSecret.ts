import { Field, SmartContract, state, State, method, Poseidon, CircuitString, Character, assert } from 'o1js';


export class IncrementSecret extends SmartContract {
    @state(Field) x = State<Field>();
    @state(Field) y = State<Field>();


    
    @method async assertData(a: CircuitString){
        const dataList: string = "Time: 2024-07-29T12:30:03.672Z, Source IP: 192.168.154.12, Destination IP: 203.249.66.153, Source Port: 55920, Destination Port: 440 | Time: 2024-07-29T12:30:03.677Z, Source IP: 192.168.154.12, Destination IP: 203.249.66.153, Source Port: 55919, Destination Port: 440 | Time: 2024-07-29T12:30:03.671Z, Source IP: 192.168.154.12, Destination IP: 203.249.66.153, Source Port: 55919, Destination Port: 440"
        a.toString()

        const logEntries: string[] = dataList.split(' | ');

        // Check if any log entry has "Destination Port: 443"
        const noDestinationPort443 = !logEntries.some(log => 
            log.split(', ').some(part => part.startsWith('Destination Port: 443'))
        );

        console.log("Result:", noDestinationPort443);

        // Assertion to check if at least one entry contains "Destination Port: 443"
        console.assert(noDestinationPort443, "Assertion failed: At least one string with Destination Port 443 found");
    }

    @method async initState(salt: Field, firstSecret: Field) {
        this.x.set(Poseidon.hash([ salt, firstSecret ]));
      }

      
    @method async incrementSecret(salt: Field, secret: Field) {
        const x = this.x.get();
        this.x.requireEquals(x);
        Poseidon.hash([ salt, secret ]).assertEquals(x);
        this.x.set(Poseidon.hash([ salt, secret.add(1) ]));
    }




}
