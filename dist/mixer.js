"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const input_1 = require("./input");
const stream_1 = require("stream");
const _ = require("underscore");
class Mixer extends stream_1.Readable {
    constructor(args) {
        super(args);
        this.needReadable = true;
        this._timer = null;
        if (args.sampleRate < 1) {
            args.sampleRate = 44100;
        }
        let buffer = new Buffer(0);
        if (args.bitDepth === 8) {
            this.readSample = buffer.readInt8;
            this.writeSample = buffer.writeInt8;
            this.sampleByteLength = 1;
        }
        else if (args.bitDepth === 32) {
            this.readSample = buffer.readInt32LE;
            this.writeSample = buffer.writeInt32LE;
            this.sampleByteLength = 4;
        }
        else {
            args.bitDepth = 16;
            this.readSample = buffer.readInt16LE;
            this.writeSample = buffer.writeInt16LE;
            this.sampleByteLength = 2;
        }
        this.args = args;
        this.inputs = [];
    }
    _read() {
        let samples = this.getMaxSamples();
        if (samples > 0 && samples !== Number.MAX_VALUE) {
            let mixedBuffer = new Buffer(samples * this.sampleByteLength * this.args.channels);
            mixedBuffer.fill(0);
            this.inputs.forEach((input) => {
                if (input.hasData) {
                    let inputBuffer = this.args.channels === 1 ? input.readMono(samples) : input.readStereo(samples);
                    for (let i = 0; i < samples * this.args.channels; i++) {
                        let sample = this.readSample.call(mixedBuffer, i * this.sampleByteLength) + Math.floor(this.readSample.call(inputBuffer, i * this.sampleByteLength) / this.inputs.length);
                        this.writeSample.call(mixedBuffer, sample, i * this.sampleByteLength);
                    }
                }
            });
            this.push(mixedBuffer);
        }
        else if (this.needReadable) {
            clearImmediate(this._timer);
            this._timer = setImmediate(this._read.bind(this));
        }
        this.clearBuffers();
    }
    input(args, channel) {
        let input = new input_1.Input({
            channels: args.channels || this.args.channels,
            bitDepth: args.bitDepth || this.args.bitDepth,
            sampleRate: args.sampleRate || this.args.sampleRate,
            volume: args.volume || 100,
            clearInterval: args.clearInterval
        });
        this.addInput(input, channel);
        return input;
    }
    removeInput(input) {
        this.inputs = _.without(this.inputs, input);
    }
    addInput(input, channel) {
        if (channel && (channel < 0 || channel >= this.args.channels)) {
            throw new Error("Channel number out of range");
        }
        input.setMixer(this);
        this.inputs[channel || this.inputs.length] = input;
    }
    destroy() {
        this.inputs = [];
    }
    close() {
        this.needReadable = false;
    }
    getMaxSamples() {
        let samples = Number.MAX_VALUE;
        this.inputs.forEach((input) => {
            let ias = input.availableSamples();
            if (ias > 0) {
                input.lastDataTime = new Date().getTime();
            }
            else if (ias <= 0 && new Date().getTime() - input.lastDataTime >= Mixer.INPUT_IDLE_TIMEOUT) {
                input.hasData = false;
                return;
            }
            if (input.hasData && ias < samples) {
                samples = ias;
            }
        });
        return samples;
    }
    clearBuffers() {
        this.inputs.forEach((input) => {
            input.clear();
        });
    }
}
Mixer.INPUT_IDLE_TIMEOUT = 250;
exports.Mixer = Mixer;
