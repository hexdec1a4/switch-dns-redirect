const dgram = require('dgram');
const dnsPacket = require('dns-packet');
const server = dgram.createSocket('udp4');

const realDns = '1.1.1.1'; // fallback DNS server
const LOCAL_IP = '192.168.1.66';   // Your Flask server local IP
const PUBLIC_IP = '162.120.185.207'; // Your public IP (external)

const spoofed = [
  'conntest.nintendowifi.net',
  'ctest.cdn.nintendo.net'
];

server.on('message', (msg, rinfo) => {
  try {
    const query = dnsPacket.decode(msg);
    const name = query.questions[0].name;
    const spoof = spoofed.includes(name);

    console.log(`DNS query for: ${name} from ${rinfo.address}:${rinfo.port} (${spoof ? "spoofing" : "forwarding"})`);

    if (spoof) {
      // Decide which IP to respond with based on request source IP
      let responseIP = LOCAL_IP;
      if (!rinfo.address.startsWith('192.168.') && !rinfo.address.startsWith('10.') && !rinfo.address.startsWith('172.')) {
        // Not from common private network ranges, send public IP
        responseIP = PUBLIC_IP;
      }

      const response = {
        type: 'response',
        id: query.id,
        flags: dnsPacket.RECURSION_DESIRED | dnsPacket.RECURSION_AVAILABLE,
        questions: query.questions,
        answers: [{
          type: 'A',
          name,
          ttl: 300,
          class: 'IN',
          data: responseIP
        }]
      };

      const res = dnsPacket.encode(response);
      server.send(res, 0, res.length, rinfo.port, rinfo.address);
    } else {
      // Forward to real DNS
      const fwd = dgram.createSocket('udp4');
      fwd.send(msg, 53, realDns);

      fwd.on('message', (response) => {
        server.send(response, 0, response.length, rinfo.port, rinfo.address);
        fwd.close();
      });
    }
  } catch (err) {
    console.error('DNS packet processing error:', err);
  }
});

server.on('listening', () => {
  const address = server.address();
  console.log(`DNS redirect server listening on ${address.address}:${address.port}`);
});

server.bind(53);
