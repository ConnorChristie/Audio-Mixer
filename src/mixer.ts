import { Input, InputArguments } from './input';
import { Readable, ReadableOptions } from 'stream';

import * as _ from 'underscore';

export interface MixerArguments extends ReadableOptions {
    channels: number;
    sampleRate: number;
    bitDepth?: number;
    clearInterval: number;
}

export class Mixer extends Readable {

    private args: MixerArguments;

    private buffer: Buffer;
    private inputs: Input[];

    private sampleByteLength: number;
    private lastTime: number;

    private readSample;
    private writeSample;

    constructor(args: MixerArguments) {
        super(args);

        if (args.channels !== 1 && args.channels !== 2) {
            args.channels = 2;
        }

        if (args.sampleRate < 1) {
            args.sampleRate = 44100;
        }

        this.buffer = new Buffer(0);

        if (args.bitDepth === 8) {
            this.readSample = this.buffer.readInt8;
            this.writeSample = this.buffer.writeInt8;

            this.sampleByteLength = 1;
        } else if (args.bitDepth === 32) {
            this.readSample = this.buffer.readInt32LE;
            this.writeSample = this.buffer.writeInt32LE;

            this.sampleByteLength = 4;
        } else {
            args.bitDepth = 16;

            this.readSample = this.buffer.readInt16LE;
            this.writeSample = this.buffer.writeInt16LE;

            this.sampleByteLength = 2;
        }

        this.args = args;

        this.inputs = [];
        this.lastTime = new Date().getTime();
    }

    /**
     * Called when this stream is read from
     */
    public _read() {
        let samples = Number.MAX_VALUE;

        this.inputs.forEach((input) => {
            let ias = input.availableSamples();
            if (ias < samples) {
                samples = ias;
            }
        });

        if (samples > 0 && samples !== Number.MAX_VALUE) {
            let mixedBuffer = new Buffer(samples * this.sampleByteLength * this.args.channels);

            mixedBuffer.fill(0);

            this.inputs.forEach((input) => {
                let inputBuffer = this.args.channels === 1 ? input.readMono(samples) : input.readStereo(samples);

                for (let i = 0; i < samples * this.args.channels; i++) {
                    let sample = this.readSample.call(mixedBuffer, i * this.sampleByteLength) + Math.round(this.readSample.call(inputBuffer, i * this.sampleByteLength) / this.inputs.length);
                    this.writeSample.call(mixedBuffer, sample, i * this.sampleByteLength);
                }
            });

            this.push(mixedBuffer);
        } else {
            setImmediate(this._read.bind(this));
        }

        this.clearBuffers();
    }

    /**
     * Adds an input to this mixer
     * @param args The input's arguments
     */
    public input(args: InputArguments) {
        let input = new Input(this, {
            channels: args.channels || this.args.channels,
            bitDepth: args.bitDepth || this.args.bitDepth,
            sampleRate: args.sampleRate || this.args.sampleRate,
            volume: args.volume || 100
        });

        this.inputs.push(input);

        return input;
    }

    /**
     * Removed the specified input
     * @param input The input
     */
    public removeInput(input) {
        this.inputs = _.without(this.inputs, input);
    }

    /**
     * Removes all of the inputs
     */
    public destroy() {
        this.inputs = [];
    }

    /**
     * Clears all of the input's buffers
     */
    private clearBuffers() {
        let now = new Date().getTime();

        if (now - this.lastTime >= this.args.clearInterval) {
            this.inputs.forEach((input) => {
                input.clear();
            });

            this.lastTime = now;
        }
    }
}
