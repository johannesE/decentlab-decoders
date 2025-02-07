
/* https://www.decentlab.com/products/pressure-/-liquid-level-and-temperature-sensor-with-g1/4-pipe-thread-for-lorawan */

var decentlab_decoder = {
  PROTOCOL_VERSION: 2,
  /* device-specific parameters */
  PARAMETERS: {
    Pmin: -1.0,
    Pmax: 10.0
  },
  SENSORS: [
    {length: 2,
     values: [{name: 'Pressure',
               convert: function (x) { return (x[0] - 16384) / 32768 * (decentlab_decoder.PARAMETERS.Pmax - decentlab_decoder.PARAMETERS.Pmin) + decentlab_decoder.PARAMETERS.Pmin; },
               unit: 'bar'},
              {name: 'Temperature',
               convert: function (x) { return (x[1] - 384) * 0.003125 - 50; },
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
  console.log(decentlab_decoder.decode("02016700034e8060170c7f"));
  console.log(decentlab_decoder.decode("02016700020c7f"));
}

main();
