/**
 * Helper class to buffer single-channel audio into appropriate packet sizes,
 * taking in arbitrary packets and converting them to 10ms packets.
 */
export class BufferedAudioSource {
  private partialPacket: Int16Array;
  private partialPacketOffset: number;

  constructor(
    private audioSource: nonstandard.RTCAudioSource,
    private sampleRate: number,
  ) {
    // Each packet stores 10ms of audio at that sample rate
    const numberOfFrames = sampleRate / 100;
    const buffer = new ArrayBuffer(2 * numberOfFrames, { maxByteLength: 2 * numberOfFrames });
    this.partialPacket = new Int16Array(buffer);
    this.partialPacketOffset = 0;
  }

  /**
   * Reads in a packet to the internal audioSource, buffering if needed
   */
  public onData(samples: Int16Array): void {
    while (samples.length > 0) {
      // Fill remaining part of partialPacket with samples
      const remainingInPartial = this.partialPacket.length - this.partialPacketOffset;
      const samplesOffset = Math.min(remainingInPartial, samples.length);
      this.partialPacket.set(samples.subarray(0, samplesOffset), this.partialPacketOffset);
      this.partialPacketOffset += samplesOffset;

      if (samplesOffset == remainingInPartial) {
        // Filled the entire partial packet, we can flush
        this.onDataFlush();
      }
      // Continue with the remaining part of the samples we haven't read from
      samples = samples.subarray(samplesOffset, samples.length);
    } 
  }

  /**
   * Flushes a completed partialPacket to the audioSource.
   */
  private onDataFlush(): void {
    // assert(this.partialPacketOffset == this.partialPacket.length);
    this.audioSource.onData({
      samples: this.partialPacket,
      sampleRate: this.sampleRate,
    });
    this.partialPacketOffset = 0;
  }
}
