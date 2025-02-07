
/* https://www.decentlab.com/support */

var decentlab_decoder = {
  PROTOCOL_VERSION: 2,
  SENSORS: [
    {length: 2,
     values: [{name: 'Dielectric permittivity',
               convert: function (x) { return x[0] / 50; }},
              {name: 'Volumetric water content',
               convert: function (x) { return 0.0000043 * Math.pow(x[0]/50, 3) - 0.00055 * Math.pow(x[0]/50, 2) + 0.0292 * (x[0]/50) - 0.053; },
               unit: 'm³⋅m⁻³'},
              {name: 'Soil temperature',
               convert: function (x) { return (x[1] - 400) / 10; },
               unit: '°C'}]},
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
  console.log(decentlab_decoder.decode("02023b0003003702710c60"));
  console.log(decentlab_decoder.decode("02023b00020c60"));
}

main();
