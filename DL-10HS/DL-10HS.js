
/* https://www.decentlab.com/support */

var decentlab_decoder = {
  PROTOCOL_VERSION: 2,
  SENSORS: [
    {length: 1,
     values: [{name: 'Raw sensor reading',
               convert: function (x) { return 3 * (x[0] - 32768) / 32768 * 1000; },
               unit: 'mV'},
              {name: 'Volumetric water content',
               convert: function (x) { return 2.97*Math.pow(10, -9) * Math.pow(3000*(x[0]-32768)/32768, 3) - 7.37*Math.pow(10, -6) * Math.pow(3000*(x[0]-32768)/32768, 2) + 6.69*Math.pow(10, -3) * (3000*(x[0]-32768)/32768) - 1.92; },
               unit: 'm³⋅m⁻³'}]},
    {length: 1,
     values: [{name: 'Battery voltage',
               convert: function (x) { return x[0] / 1000; },
               unit: 'V'}]}
  ],

  read_int: function (bytes) {
    return (bytes.shift() << 8) + bytes.shift();
  },

  decode: function (msg) {
    var bytes = msg;
    var i, j;
    if (typeof msg === 'string') {
      bytes = [];
      for (i = 0; i < msg.length; i += 2) {
        bytes.push(parseInt(msg.substring(i, i + 2), 16));
      }
    }

    var version = bytes.shift();
    if (version != this.PROTOCOL_VERSION) {
      return {error: "protocol version " + version + " doesn't match v2"};
    }

    var deviceId = this.read_int(bytes);
    var flags = this.read_int(bytes);
    var result = {'Protocol version': version, 'Device ID': deviceId};
    // decode payload
    for (i = 0; i < this.SENSORS.length; i++, flags >>= 1) {
      if ((flags & 1) !== 1)
        continue;

      var sensor = this.SENSORS[i];
      var x = [];
      // convert data to 16-bit integer array
      for (j = 0; j < sensor.length; j++) {
        x.push(this.read_int(bytes));
      }

      // decode sensor values
      for (j = 0; j < sensor.values.length; j++) {
        var value = sensor.values[j];
        if ('convert' in value) {
          result[value.name] = {value: value.convert(x),
                                unit: value.unit};
        }
      }
    }
    return result;
  }
};

function main() {
  console.log(decentlab_decoder.decode("0202df000393710c60"));
  console.log(decentlab_decoder.decode("0202df00020c60"));
}

main();
