"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mixer_1 = require("./mixer");
class InterleavedMixer extends mixer_1.Mixer {
    _read() {
        let samples = this.getMaxSamples();
        if (samples > 0 && samples !== Number.MAX_VALUE) {
            let mixedBuffer = new Buffer(samples * this.sampleByteLength * this.args.channels);
            mixedBuffer.fill(0);
            for (let c = 0; c < this.args.channels; c++) {
                let input = this.inputs[c];
                if (input !== undefined && input.hasData) {
                    let inputBuffer = input.readMono(samples);
                    for (let i = 0; i < samples; i++) {
                        let sample = this.readSample.call(inputBuffer, i * this.sampleByteLength);
                        this.writeSample.call(mixedBuffer, sample, (i * this.sampleByteLength * this.args.channels) + (c * this.sampleByteLength));
                    }
                }
            }
            this.push(mixedBuffer);
        }
        else {
            setImmediate(this._read.bind(this));
        }
        this.clearBuffers();
    }
}
exports.InterleavedMixer = InterleavedMixer;
