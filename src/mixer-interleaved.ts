import { Input, InputArguments } from './input';
import { Readable, ReadableOptions } from 'stream';

import * as _ from 'underscore';

export interface InterleavedMixerArguments extends ReadableOptions {
    channels: number;
    sampleRate: number;
    bitDepth?: number;
    clearInterval?: number;
}

export class InterleavedMixer extends Readable {

    private args: InterleavedMixerArguments;

    private buffer: Buffer;
    private inputs: Input[];

    private sampleByteLength: number;
    private lastTime: number;

    private readSample;
    private writeSample;

    constructor(args: InterleavedMixerArguments) {
        super(args);

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

            for (let c = 0; c < this.args.channels; c++) {
                let input = this.inputs[c];

                if (input !== undefined) {
                    let inputBuffer = input.readMono(samples);

                    for (let i = 0; i < samples; i++) {
                        let sample = this.readSample.call(inputBuffer, i * this.sampleByteLength);

                        this.writeSample.call(mixedBuffer, sample, (i * this.sampleByteLength * this.args.channels) + (c * this.sampleByteLength));
                    }
                }
            }

            this.push(mixedBuffer);
        } else {
            setImmediate(this._read.bind(this));
        }

        if (this.args.clearInterval) {
            this.clearBuffers();
        }
    }

    /**
     * Adds an input to this mixer
     * @param args The input's arguments
     */
    public input(channel: number, args: InputArguments) {
        let input = new Input({
            channels: args.channels || 1,
            bitDepth: args.bitDepth || this.args.bitDepth,
            sampleRate: args.sampleRate || this.args.sampleRate,
            volume: args.volume || 100
        });

        this.addInput(channel, input);

        return input;
    }

    /**
     * Removes the specified input
     * @param input The input
     */
    public removeInput(input: Input) {
        this.inputs = _.without(this.inputs, input);
    }

    /**
     * Adds the specified input to this mixer
     * @param input The input
     */
    public addInput(channel: number, input: Input) {
        if (channel < 0 || channel > this.args.channels - 1) {
            throw new Error("Channel number out of range");
        }

        this.inputs[channel] = input;
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
