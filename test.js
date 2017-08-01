const { InterleavedMixer } = require('./dist/index.js');

const AudioStream = require('audio-cmd-stream');

setTimeout(() => console.log('done'), 1234567);

var mixer = new InterleavedMixer({
    channels: 2,
    clearInterval: 250
});

var in1 = new AudioStream.Input(1);
var in2 = new AudioStream.Input(2);

var out = new AudioStream.Output(4);

mixer.pipe(out);

var mixIn1 = mixer.input({
    channels: 2
});

var mixIn2 = mixer.input({
    channels: 2
});

in1.pipe(mixIn1);
in2.pipe(mixIn2);

setTimeout(function() {
    in2.unpipe(mixIn2);

    setTimeout(function() {
        in2.pipe(mixIn2);
        in1.unpipe(mixIn1);
    }, 4000);
}, 4000);
