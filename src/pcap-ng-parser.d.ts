declare module 'pcap-ng-parser' {
    import { Transform } from 'stream';
  
    class PCAPNGParser extends Transform {
      constructor();
    }
  
    export = PCAPNGParser;
  }