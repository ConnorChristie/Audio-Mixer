/// <reference types="node" />
import { Writable, WritableOptions } from 'stream';
import { Mixer } from './mixer';
export interface InputArguments extends WritableOptions {
    channels?: number;
    bitDepth?: number;
    sampleRate?: number;
    volume?: number;
    clearInterval?: number;
}
export declare class Input extends Writable {
    private mixer;
    private args;
    private buffer;
    private sampleByteLength;
    private readSample;
    private writeSample;
    hasData: boolean;
    lastDataTime: number;
    lastClearTime: number;
    constructor(args: InputArguments);
    setMixer(mixer: Mixer): void;
    read(samples: any): Buffer;
    readMono(samples: any): Buffer;
    readStereo(samples: any): Buffer;
    availableSamples(length?: number): number;
    _write(chunk: any, encoding: any, next: any): void;
    setVolume(volume: number): void;
    getVolume(): number;
    clear(force?: boolean): void;
    destroy(): void;
}
