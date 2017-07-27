const { InterleavedMixer } = require('./dist/index.js');

const AudioStream = require('audio-cmd-stream');

setTimeout(() => console.log('done'), 1234567);

var mixer = new InterleavedMixer({
    channels: 2
});

var in1 = new AudioStream.Input(2);
var in2 = new AudioStream.Input(3);

var out = new AudioStream.Output(5);

mixer.pipe(out);

var mixIn1 = mixer.input({
    channels: 2
}, 0);

var mixIn2 = mixer.input({
    channels: 2
}, 1);

in1.pipe(mixIn1);
in2.pipe(mixIn2);
