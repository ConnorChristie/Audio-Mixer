/// <reference types="node" />
import { Input, InputArguments } from './input';
import { Readable, ReadableOptions } from 'stream';
export interface MixerArguments extends ReadableOptions {
    channels: number;
    sampleRate: number;
    bitDepth?: number;
}
export declare class Mixer extends Readable {
    protected args: MixerArguments;
    protected inputs: Input[];
    protected sampleByteLength: number;
    protected readSample: any;
    protected writeSample: any;
    protected needReadable: boolean;
    private static INPUT_IDLE_TIMEOUT;
    private _timer;
    constructor(args: MixerArguments);
    _read(): void;
    input(args: InputArguments, channel?: number): Input;
    removeInput(input: Input): void;
    addInput(input: Input, channel?: number): void;
    destroy(): void;
    close(): void;
    protected getMaxSamples(): number;
    protected clearBuffers(): void;
}
