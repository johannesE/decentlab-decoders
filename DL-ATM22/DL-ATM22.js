
/* https://www.decentlab.com/products/wind-speed-wind-direction-and-temperature-sensor-for-lorawan */

var decentlab_decoder = {
  PROTOCOL_VERSION: 2,
  SENSORS: [
    {length: 8,
     values: [{name: 'Wind speed',
               convert: function (x) { return (x[0] - 32768) / 100; },
               unit: 'm⋅s⁻¹'},
              {name: 'Wind direction',
               convert: function (x) { return (x[1] - 32768) / 10; },
               unit: '°'},
              {name: 'Maximum wind speed',
               convert: function (x) { return (x[2] - 32768) / 100; },
               unit: 'm⋅s⁻¹'},
              {name: 'Air temperature',
               convert: function (x) { return (x[3] - 32768) / 10; },
               unit: '°C'},
              {name: 'X orientation angle',
               convert: function (x) { return (x[4] - 32768) / 10; },
               unit: '°'},
              {name: 'Y orientation angle',
               convert: function (x) { return (x[5] - 32768) / 10; },
               unit: '°'},
              {name: 'North wind speed',
               convert: function (x) { return (x[6] - 32768) / 100; },
               unit: 'm⋅s⁻¹'},
              {name: 'East wind speed',
               convert: function (x) { return (x[7] - 32768) / 100; },
               unit: 'm⋅s⁻¹'}]},
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
  console.log(decentlab_decoder.decode("0208c900038009812b8014810880027fe8800880040bf5"));
  console.log(decentlab_decoder.decode("0208c900020bf5"));
}

main();
