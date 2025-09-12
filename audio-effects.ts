
/**
 * @fileoverview A dedicated module for complex Web Audio API effect chains.
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type MasteringChainParams = {
    // Compressor settings
    compThreshold: number; // dB, e.g., -24
    compKnee: number; // dB, e.g., 30
    compRatio: number; // e.g., 12
    compAttack: number; // seconds, e.g., 0.003
    compRelease: number; // seconds, e.g., 0.25
    
    // EQ settings
    eqLowGain: number; // dB
    eqMidGain: number; // dB
    eqHighGain: number; // dB
    
    // Saturation settings
    saturation: number; // Arbitrary scale, e.g., 0-100
    
    // Final Limiter/Gain settings
    limiterGain: number; // Linear gain multiplier
};

export type MasteringChain = {
    name: string;
    description: string;
    params: MasteringChainParams;
};

export async function applyMasteringChain(options: {
    audioContext: AudioContext;
    sourceBuffer: AudioBuffer;
    params: MasteringChainParams;
}): Promise<AudioBuffer> {
    const { audioContext, sourceBuffer, params } = options;

    const offlineCtx = new OfflineAudioContext(sourceBuffer.numberOfChannels, sourceBuffer.length, sourceBuffer.sampleRate);

    // 1. Source Node
    const source = offlineCtx.createBufferSource();
    source.buffer = sourceBuffer;

    // 2. EQ Chain
    const eqLow = offlineCtx.createBiquadFilter();
    eqLow.type = 'lowshelf';
    eqLow.frequency.value = 120; // Bass frequencies
    eqLow.gain.value = params.eqLowGain;

    const eqMid = offlineCtx.createBiquadFilter();
    eqMid.type = 'peaking';
    eqMid.frequency.value = 1500; // Mid-range presence
    eqMid.Q.value = 1.5;
    eqMid.gain.value = params.eqMidGain;

    const eqHigh = offlineCtx.createBiquadFilter();
    eqHigh.type = 'highshelf';
    eqHigh.frequency.value = 8000; // High-end air
    eqHigh.gain.value = params.eqHighGain;

    // 3. Compressor
    const compressor = offlineCtx.createDynamicsCompressor();
    compressor.threshold.setValueAtTime(params.compThreshold, 0);
    compressor.knee.setValueAtTime(params.compKnee, 0);
    compressor.ratio.setValueAtTime(params.compRatio, 0);
    compressor.attack.setValueAtTime(params.compAttack, 0);
    compressor.release.setValueAtTime(params.compRelease, 0);

    // 4. Saturation (WaveShaper)
    const waveShaper = offlineCtx.createWaveShaper();
    const k = params.saturation; // Amount of distortion
    const n_samples = 44100;
    const curve = new Float32Array(n_samples);
    for (let i = 0; i < n_samples; ++i) {
        const x = i * 2 / n_samples - 1;
        // Simple tanh-like curve for saturation
        curve[i] = Math.tanh(x * (1 + k / 10));
    }
    waveShaper.curve = curve;
    waveShaper.oversample = '4x';

    // 5. Final Limiter (using a Gain node for simplicity)
    const limiter = offlineCtx.createGain();
    limiter.gain.value = params.limiterGain;

    // Connect the chain
    source.connect(eqLow)
          .connect(eqMid)
          .connect(eqHigh)
          .connect(compressor)
          .connect(waveShaper)
          .connect(limiter)
          .connect(offlineCtx.destination);
    
    source.start(0);

    return offlineCtx.startRendering();
}
