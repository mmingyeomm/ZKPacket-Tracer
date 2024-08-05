import { ZkProgram, SelfProof, Bool, CircuitString, Mina, Field, Bytes, UInt8, UInt64, UInt32 } from 'o1js';

export const TestSecondElement = ZkProgram({
  name: 'test-program',
  publicInput: CircuitString,  
  publicOutput: Bool,

  methods: {
    base: {
      privateInputs: [UInt64],

      async method(publicInput: CircuitString, a :UInt64) {

        const div = UInt64.from(10);
        const result = a.divMod(div)

        result.quotient.value.assertEquals(Field(10))
        
        return Bool(true);
      },
    },

    checkTrue: {
      privateInputs: [SelfProof],
      async method(
        newState: CircuitString,
        earlierProof: SelfProof<CircuitString, Bool>
      ) {
        earlierProof.verify();

        return Bool(
          newState.substring(1, 2).equals(CircuitString.fromString('2'))
        );
      },
    },
  },
});


const Local = await Mina.LocalBlockchain({ proofsEnabled: false });
Mina.setActiveInstance(Local);

await TestSecondElement.compile();

// BASE CASE
console.log("start base")
const baseField = Field.from('1234234');
const baseCs = CircuitString.fromString(baseField.toString());
const number = UInt64.from(100)
const baseProof = await TestSecondElement.base(baseCs, number);
console.log(baseProof.publicOutput.toBoolean(), '\n');
console.log("end base")

// STEP CASES
let stepField = Field.from('1654');
let stepCs = CircuitString.fromString(stepField.toString());
let stepProof = await TestSecondElement.checkTrue(stepCs, baseProof);
console.log(stepProof.publicOutput.toBoolean(), '\n');

stepField = Field.from('123654');
stepCs = CircuitString.fromString(stepField.toString());
stepProof = await TestSecondElement.checkTrue(stepCs, stepProof);
console.log(stepProof.publicOutput.toBoolean(), '\n');