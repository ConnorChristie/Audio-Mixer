# Audio-Mixer

Allows mixing of PCM audio streams.

## Installation
```
npm i audio-mixer -S
```

## API

### `Mixer.new`
```js
// @options - The options for the mixer
let mixer = new Mixer(options: MixerArguments);

// @channels - The number of channels this output has
// @bitDepth - The bit depth of the data going to the output
// @sampleRate - The sample rate of the output
// @clearInterval - An interval in ms of when to dump the stream to keep the inputs in sync (when not specified the stream is not dumped)
interface MixerArguments extends ReadableOptions {
    channels: number;
    bitDepth?: number;
    sampleRate: number;
    clearInterval?: number;
}
```

### `Mixer.input`
```js
// @options - The options for this input
let input = mixer.input(options: InputArguments);

// @channels - The number of channels this input has (default uses Mixer's)
// @bitDepth - The bit depth of the data coming in this input (default uses Mixer's)
// @sampleRate - The sample rate of this input (default uses Mixer's)
// @volume - The volume to set this input to when mixing (default is 100)
interface InputArguments extends WritableOptions {
    channels?: number;
    bitDepth?: number;
    sampleRate?: number;
    volume?: number;
}
```

### `Mixer.removeInput(input)`
```js
// @input - The input to remove from the mixer
mixer.removeInput(input);
```

### `Input.new`
```js
// @options - The options for this input
let input = new Input(options: InputArguments);

// @channels - The number of channels this input has
// @bitDepth - The bit depth of the data coming in this input
// @sampleRate - The sample rate of this input
// @volume - The volume to set this input to when mixing (default is 100)
interface InputArguments extends WritableOptions {
    channels?: number;
    bitDepth?: number;
    sampleRate?: number;
    volume?: number;
}
```

### `Input.getVolume()`
```js
input.getVolume();
```

### `Input.setVolume(volume)`
```js
// @volume - The volume to set this input to
input.setVolume(volume);
```

## Code Example
```js
var AudioMixer = require('audio-mixer');

// Creates a new audio mixer with the specified options
let mixer = new AudioMixer.Mixer({
    channels: 2,
    bitDepth: 16,
    sampleRate: 44100,
    clearInterval: 250
});

// Creates an input that is attached to the mixer
let input = mixer.input({
    channels: 1,
    volume: 75
});

// Creates a standalone input
let standaloneInput = new AudioMixer.Input({
    channels: 1,
    bitDepth: 16,
    sampleRate: 48000,
    volume: 75
});

// Adds the standalone input to the mixer
mixer.addInput(standaloneInput);

// Pipes a readable stream into an input
deviceInputStream.pipe(input);
deviceInputStream2.pipe(standaloneInput);

// Pipes the mixer output to an writable stream
mixer.pipe(deviceOutputStream);
```