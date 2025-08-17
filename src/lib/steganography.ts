import CryptoJS from 'crypto-js';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import { createFFmpeg, fetchFile } from '@ffmpeg/ffmpeg';

// ---------- Helpers used by both classes ----------
function seededPRNG(seed: string) {
  let state = 0;
  for (let i = 0; i < seed.length; i++) {
    state = (state * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

// Partial Fisher-Yates to get `needed` unique indices (deterministic given prng)
function generateIndicesPRNG(prng: () => number, length: number, needed: number): number[] {
  if (needed > length) throw new Error('needed > length');
  const arr = new Uint32Array(length);
  for (let i = 0; i < length; i++) arr[i] = i;
  // Shuffle only enough elements so the last `needed` entries are randomized
  for (let i = length - 1; i >= length - needed; i--) {
    const j = Math.floor(prng() * (i + 1));
    const tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
  }
  // return the last `needed` elements
  return Array.from(arr.slice(length - needed));
}

function bytesToBitString(bytes: Uint8Array): string {
  let s = '';
  for (let b of bytes) s += b.toString(2).padStart(8, '0');
  return s;
}
function bitStringToBytes(bits: string): Uint8Array {
  const n = Math.floor(bits.length / 8);
  const out = new Uint8Array(n);
  for (let i = 0; i < n; i++) {
    out[i] = parseInt(bits.substr(i * 8, 8), 2);
  }
  return out;
}

function decodeRedundantBits(redundantBits: string): string {
  let decoded = '';
  for (let i = 0; i < redundantBits.length; i += 3) {
    const triplet = redundantBits.substr(i, 3);
    if (triplet.length < 3) break;
    const ones = (triplet.match(/1/g) || []).length;
    decoded += ones >= 2 ? '1' : '0';
  }
  return decoded;
}

// Convert AudioBuffer -> Int16Array (mono: first channel)
function audioBufferToInt16Array(buffer: AudioBuffer): Int16Array {
  const samples = buffer.getChannelData(0);
  const int16 = new Int16Array(samples.length);
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    int16[i] = s < 0 ? Math.round(s * 0x8000) : Math.round(s * 0x7fff);
  }
  return int16;
}
function int16ArrayToWav(samples: Int16Array, sampleRate: number): ArrayBuffer {
  const length = samples.length;
  const buffer = new ArrayBuffer(44 + length * 2);
  const view = new DataView(buffer);
  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  };
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + length * 2, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, length * 2, true);
  for (let i = 0; i < length; i++) view.setInt16(44 + i * 2, samples[i], true);
  return buffer;
}
// Text Steganography using zero-width characters
export class TextSteganography {
  private static readonly ZERO_WIDTH_SPACE = '\u200B';
  private static readonly ZERO_WIDTH_NON_JOINER = '\u200C';
  private static readonly ZERO_WIDTH_JOINER = '\u200D';
  private static readonly ZERO_WIDTH_NO_BREAK_SPACE = '\uFEFF';

  static encode(coverText: string, secretMessage: string, password?: string): string {
    let messageToEncode = secretMessage;
    
    // Encrypt if password provided
    if (password) {
      messageToEncode = CryptoJS.AES.encrypt(secretMessage, password).toString();
    }

    // Convert message to binary
    const binaryMessage = messageToEncode
      .split('')
      .map(char => char.charCodeAt(0).toString(2).padStart(8, '0'))
      .join('');

    // Add end marker
    const binaryWithMarker = binaryMessage + '1111111111111110'; // End marker

    let result = '';
    let binaryIndex = 0;

    for (let i = 0; i < coverText.length && binaryIndex < binaryWithMarker.length; i++) {
      result += coverText[i];

      // Add zero-width characters based on binary pairs
      if (binaryIndex < binaryWithMarker.length - 1) {
        const pair = binaryWithMarker.substr(binaryIndex, 2);
        switch (pair) {
          case '00':
            result += this.ZERO_WIDTH_SPACE;
            break;
          case '01':
            result += this.ZERO_WIDTH_NON_JOINER;
            break;
          case '10':
            result += this.ZERO_WIDTH_JOINER;
            break;
          case '11':
            result += this.ZERO_WIDTH_NO_BREAK_SPACE;
            break;
        }
        binaryIndex += 2;
      }
    }

    // Add remaining cover text
    result += coverText.slice(result.replace(/[\u200B\u200C\u200D\uFEFF]/g, '').length);

    return result;
  }

  static decode(stegoText: string, password?: string): string | null {
    try {
      // Extract zero-width characters
      const zeroWidthChars = stegoText.match(/[\u200B\u200C\u200D\uFEFF]/g) || [];
      
      if (zeroWidthChars.length === 0) {
        return null;
      }

      // Convert back to binary
      let binary = '';
      for (const char of zeroWidthChars) {
        switch (char) {
          case this.ZERO_WIDTH_SPACE:
            binary += '00';
            break;
          case this.ZERO_WIDTH_NON_JOINER:
            binary += '01';
            break;
          case this.ZERO_WIDTH_JOINER:
            binary += '10';
            break;
          case this.ZERO_WIDTH_NO_BREAK_SPACE:
            binary += '11';
            break;
        }
      }

      // Find end marker
      const endMarker = '1111111111111110';
      const endIndex = binary.indexOf(endMarker);
      
      if (endIndex === -1) {
        return null;
      }

      // Extract message binary
      const messageBinary = binary.substring(0, endIndex);
      
      // Convert binary to text
      let decodedMessage = '';
      for (let i = 0; i < messageBinary.length; i += 8) {
        const byte = messageBinary.substr(i, 8);
        if (byte.length === 8) {
          decodedMessage += String.fromCharCode(parseInt(byte, 2));
        }
      }

      // Decrypt if password provided
      if (password) {
        try {
          const decryptedBytes = CryptoJS.AES.decrypt(decodedMessage, password);
          const decryptedMessage = decryptedBytes.toString(CryptoJS.enc.Utf8);
          return decryptedMessage || null;
        } catch {
          return null; // Wrong password
        }
      }

      return decodedMessage;
    } catch {
      return null;
    }
  }
}

// Image Steganography using LSB (Least Significant Bit) technique
export class ImageSteganography {
  static encode(canvas: HTMLCanvasElement, secretMessage: string, password?: string): HTMLCanvasElement {
    const ctx = canvas.getContext('2d')!;
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    let messageToEncode = secretMessage;
    
    // Encrypt if password provided
    if (password) {
      messageToEncode = CryptoJS.AES.encrypt(secretMessage, password).toString();
    }

    // Convert message to binary with end marker
    const binaryMessage = messageToEncode
      .split('')
      .map(char => char.charCodeAt(0).toString(2).padStart(8, '0'))
      .join('') + '1111111111111110'; // End marker

    // Check if image can hold the message
    if (binaryMessage.length > data.length / 4) {
      throw new Error('Message too large for this image');
    }

    // Embed message in LSB of red channel
    for (let i = 0; i < binaryMessage.length; i++) {
      const pixelIndex = i * 4; // Red channel of pixel i
      const bit = parseInt(binaryMessage[i]);
      
      // Clear LSB and set new bit
      data[pixelIndex] = (data[pixelIndex] & 0xFE) | bit;
    }

    ctx.putImageData(imageData, 0, 0);
    return canvas;
  }

  static decode(canvas: HTMLCanvasElement, password?: string): string | null {
    try {
      const ctx = canvas.getContext('2d')!;
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      let binary = '';
      const endMarker = '1111111111111110';

      // Extract bits from LSB of red channel
      for (let i = 0; i < data.length / 4; i++) {
        const pixelIndex = i * 4;
        const bit = data[pixelIndex] & 1;
        binary += bit;

        // Check for end marker
        if (binary.endsWith(endMarker)) {
          break;
        }
      }

      // Find end marker
      const endIndex = binary.indexOf(endMarker);
      if (endIndex === -1) {
        return null;
      }

      // Extract message binary
      const messageBinary = binary.substring(0, endIndex);

      // Convert binary to text
      let decodedMessage = '';
      for (let i = 0; i < messageBinary.length; i += 8) {
        const byte = messageBinary.substr(i, 8);
        if (byte.length === 8) {
          decodedMessage += String.fromCharCode(parseInt(byte, 2));
        }
      }

      // Decrypt if password provided
      if (password) {
        try {
          const decryptedBytes = CryptoJS.AES.decrypt(decodedMessage, password);
          const decryptedMessage = decryptedBytes.toString(CryptoJS.enc.Utf8);
          return decryptedMessage || null;
        } catch {
          return null; // Wrong password
        }
      }

      return decodedMessage;
    } catch {
      return null;
    }
  }
}

// ---------- AudioSteganography (corrected) ----------
export class AudioSteganography {
  private static ffmpeg: ReturnType<typeof createFFmpeg> | null = null;

  // Embedding parameters (keep similar to your original)
  private static redundancy = 3; // triple redundancy
  private static embeddingFraction = 0.8; // fraction of samples considered for embedding

  private static async initFFmpeg(): Promise<ReturnType<typeof createFFmpeg>> {
    if (!this.ffmpeg) {
      this.ffmpeg = createFFmpeg({ log: false });
      await this.ffmpeg.load();
    }
    return this.ffmpeg;
  }

  private static async fileToAudioBuffer(file: File): Promise<{ buffer: AudioBuffer, originalFormat: string }> {
    const arrayBuffer = await file.arrayBuffer();
    try {
      const audioContext = new AudioContext();
      const buffer = await audioContext.decodeAudioData(arrayBuffer.slice(0));
      audioContext.close();
      return { buffer, originalFormat: file.type };
    } catch {
      const ffmpeg = await this.initFFmpeg();
      const inputName = `input.${file.name.split('.').pop()}`;
      await ffmpeg.FS('writeFile', inputName, await fetchFile(file));
      await ffmpeg.run('-i', inputName, '-f', 'wav', '-ac', '1', '-ar', '44100', 'output.wav');
      const wavData = ffmpeg.FS('readFile', 'output.wav') as Uint8Array;
      const wavBuffer = wavData.buffer.slice(0);
      const audioContext = new AudioContext();
      const buffer = await audioContext.decodeAudioData(wavBuffer);
      audioContext.close();
      return { buffer, originalFormat: 'converted' };
    }
  }

  static async calculateCapacity(file: File): Promise<number> {
    const { buffer } = await this.fileToAudioBuffer(file);
    const samples = this.audioBufferToInt16Array(buffer);
    // capacity bits available for LSB embedding (we use embeddingFraction of samples)
    const capacityBits = Math.floor(samples.length * this.embeddingFraction);
    // account for redundancy
    const payloadBits = Math.floor(capacityBits / this.redundancy);
    const payloadBytes = Math.floor(payloadBits / 8);
    // subtract header (magic 7 bytes + 4 bytes length)
    return Math.max(0, payloadBytes - (7 + 4));
  }

  private static audioBufferToInt16Array(buffer: AudioBuffer) {
    return audioBufferToInt16Array(buffer);
  }

  static async encode(file: File, secretMessage: string, password?: string): Promise<Blob> {
    const { buffer } = await this.fileToAudioBuffer(file);
    const samples = this.audioBufferToInt16Array(buffer);

    // Preserve user flow: if password provided, use CryptoJS.AES.encrypt (keeps your earlier logic)
    let messageToEncode = secretMessage;
    if (password) {
      messageToEncode = CryptoJS.AES.encrypt(secretMessage, password).toString();
    }

    // Build header: MAGIC + 32-bit length + message
    const header = 'USTEGA1'; // 7 bytes
    const headerBytes = new Uint8Array(header.split('').map(c => c.charCodeAt(0)));
    const msgBytes = new TextEncoder().encode(messageToEncode);
    const len = msgBytes.length;
    const lenBinary = len.toString(2).padStart(32, '0');
    const headerBinary = bytesToBitString(headerBytes);
    const messageBinary = bytesToBitString(msgBytes);
    const fullBinary = headerBinary + lenBinary + messageBinary;

    // 3x redundancy
    const redundantBinary = fullBinary.split('').flatMap(bit => [bit, bit, bit]).join('');

    // capacity check (bits)
    const capacityBits = Math.floor(samples.length * this.embeddingFraction);
    if (redundantBinary.length > capacityBits) {
      throw new Error('Message too large for this audio file');
    }

    // PRNG seed: keep using CryptoJS.SHA256(password).toString() if password else default
    const seed = password ? CryptoJS.SHA256(password).toString() : 'default-seed';
    const prng = seededPRNG(seed);

    // Generate deterministic unique indices (fast)
    const indices = generateIndicesPRNG(prng, samples.length, redundantBinary.length);

    // Embed bits into LSB of samples
    const modifiedSamples = new Int16Array(samples); // copy
    for (let i = 0; i < redundantBinary.length; i++) {
      const sampleIndex = indices[i];
      const bit = parseInt(redundantBinary[i], 10);
      modifiedSamples[sampleIndex] = (modifiedSamples[sampleIndex] & 0xFFFE) | bit;
    }

    // Export as WAV (preserve sampleRate)
    const wavBuffer = int16ArrayToWav(modifiedSamples, buffer.sampleRate);
    return new Blob([wavBuffer], { type: 'audio/wav' });
  }

  static async decode(file: File, password?: string): Promise<string | null> {
    try {
      const { buffer } = await this.fileToAudioBuffer(file);
      const samples = this.audioBufferToInt16Array(buffer);

      const seed = password ? CryptoJS.SHA256(password).toString() : 'default-seed';
      const prng = seededPRNG(seed);

      // We'll read as many bits as encoder could have used (capacityBits)
      const capacityBits = Math.floor(samples.length * this.embeddingFraction);
      const indices = generateIndicesPRNG(prng, samples.length, capacityBits);

      // Read redundant bit stream in same order
      let redundantStream = '';
      for (let i = 0; i < indices.length; i++) {
        redundantStream += (samples[indices[i]] & 1).toString();
        // If we already have enough redundant bits to decode header + length (7 bytes + 32 bits) after majority,
        // try to decode early to stop sooner.
        const minRedundantNeeded = (7 * 8 + 32) * this.redundancy;
        if (redundantStream.length >= minRedundantNeeded) {
          const decodedSoFar = decodeRedundantBits(redundantStream);
          const headerBinary = bytesToBitString(new Uint8Array('USTEGA1'.split('').map(c => c.charCodeAt(0))));
          const headerIndex = decodedSoFar.indexOf(headerBinary);
          if (headerIndex !== -1 && decodedSoFar.length >= headerIndex + headerBinary.length + 32) {
            // read 32-bit len
            const lenBits = decodedSoFar.substr(headerIndex + headerBinary.length, 32);
            const msgLen = parseInt(lenBits, 2);
            const totalMsgBits = msgLen * 8;
            // check if we have full message bits already
            if (decodedSoFar.length >= headerIndex + headerBinary.length + 32 + totalMsgBits) {
              const messageBits = decodedSoFar.substr(headerIndex + headerBinary.length + 32, totalMsgBits);
              const msgBytes = bitStringToBytes(messageBits);
              const decodedMessage = new TextDecoder().decode(msgBytes);
              // decrypt if password
              if (password) {
                try {
                  const decryptedBytes = CryptoJS.AES.decrypt(decodedMessage, password);
                  const decryptedMessage = decryptedBytes.toString(CryptoJS.enc.Utf8);
                  return decryptedMessage || null;
                } catch {
                  return null;
                }
              }
              return decodedMessage;
            }
          }
        }
      }

      // If we get here, try a final decode on all collected stream
      const decodedAll = decodeRedundantBits(redundantStream);
      const headerBinary = bytesToBitString(new Uint8Array('USTEGA1'.split('').map(c => c.charCodeAt(0))));
      const headerIndex = decodedAll.indexOf(headerBinary);
      if (headerIndex === -1) return null;
      const lenBits = decodedAll.substr(headerIndex + headerBinary.length, 32);
      const msgLen = parseInt(lenBits, 2);
      const totalMsgBits = msgLen * 8;
      const messageBits = decodedAll.substr(headerIndex + headerBinary.length + 32, totalMsgBits);
      if (messageBits.length < totalMsgBits) return null;
      const msgBytes = bitStringToBytes(messageBits);
      const decodedMessage = new TextDecoder().decode(msgBytes);
      if (password) {
        try {
          const decryptedBytes = CryptoJS.AES.decrypt(decodedMessage, password);
          const decryptedMessage = decryptedBytes.toString(CryptoJS.enc.Utf8);
          return decryptedMessage || null;
        } catch {
          return null;
        }
      }
      return decodedMessage;
    } catch {
      return null;
    }
  }

  private static decodeRedundantBits(redundantBits: string): string {
    return decodeRedundantBits(redundantBits);
  }
}

// ---------- VideoSteganography (corrected) ----------
export class VideoSteganography {
  private static ffmpeg: ReturnType<typeof createFFmpeg> | null = null;

  private static async initFFmpeg(): Promise<ReturnType<typeof createFFmpeg>> {
    if (!this.ffmpeg) {
      this.ffmpeg = createFFmpeg({ log: false });
      await this.ffmpeg.load();
    }
    return this.ffmpeg;
  }

  private static seededPRNG = seededPRNG;

  private static async videoToFrames(file: File): Promise<{ frames: ImageData[], fps: number, width: number, height: number }> {
    const ffmpeg = await this.initFFmpeg();
    const inputName = `input.${file.name.split('.').pop()}`;
    await ffmpeg.FS('writeFile', inputName, await fetchFile(file));

    // Extract frames (limit to 30s for performance like your original)
    await ffmpeg.run(
      '-i', inputName,
      '-t', '30',
      '-vf', 'scale=640:480,fps=10',
      '-f', 'image2',
      'frame_%03d.png'
    );

    const frames: ImageData[] = [];
    let frameIndex = 1;
    while (true) {
      try {
        const name = `frame_${frameIndex.toString().padStart(3, '0')}.png`;
        const frameData = ffmpeg.FS('readFile', name) as Uint8Array;
        const blob = new Blob([frameData.buffer], { type: 'image/png' });
        const img = new Image();
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = reject;
          img.src = URL.createObjectURL(blob);
        });
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        frames.push(imageData);
        URL.revokeObjectURL(img.src);
        frameIndex++;
      } catch {
        break;
      }
    }

    if (frames.length === 0) throw new Error('No frames extracted');
    return { frames, fps: 10, width: frames[0].width, height: frames[0].height };
  }

  private static async framesToVideo(frames: ImageData[], fps: number, width: number, height: number): Promise<Blob> {
    const ffmpeg = await this.initFFmpeg();

    // write frames back
    for (let i = 0; i < frames.length; i++) {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d')!;
      ctx.putImageData(frames[i], 0, 0);
      // canvas.toBlob is async
      const blob = await new Promise<Blob>((res) => canvas.toBlob(b => res(b!), 'image/png'));
      const arr = new Uint8Array(await blob.arrayBuffer());
      await ffmpeg.FS('writeFile', `frame_${i.toString().padStart(3, '0')}.png`, arr);
    }

    // try to encode with vp9 lossless, fallback if not available
    try {
      await ffmpeg.run('-r', String(fps), '-i', 'frame_%03d.png', '-c:v', 'libvpx-vp9', '-lossless', '1', '-an', 'output.webm');
      const out = ffmpeg.FS('readFile', 'output.webm') as Uint8Array;
      return new Blob([out.buffer], { type: 'video/webm' });
    } catch {
      // fallback to mjpeg (large but widely supported in wasm builds)
      await ffmpeg.run('-r', String(fps), '-i', 'frame_%03d.png', '-c:v', 'mjpeg', '-q:v', '3', '-an', 'output.avi');
      const out = ffmpeg.FS('readFile', 'output.avi') as Uint8Array;
      return new Blob([out.buffer], { type: 'video/avi' });
    }
  }

  static async encode(file: File, secretMessage: string, password?: string, onProgress?: (progress: number) => void): Promise<Blob> {
    if (onProgress) onProgress(10);
    const { frames, fps, width, height } = await this.videoToFrames(file);
    if (onProgress) onProgress(30);

    let messageToEncode = secretMessage;
    if (password) {
      // keep your CryptoJS-based encryption for minimal changes
      messageToEncode = CryptoJS.AES.encrypt(secretMessage, password).toString();
    }

    // Build header & binary (length-prefixed)
    const header = 'VSTEGA1';
    const headerBinary = bytesToBitString(new Uint8Array(header.split('').map(c => c.charCodeAt(0))));
    const msgBytes = new TextEncoder().encode(messageToEncode);
    const lenBinary = msgBytes.length.toString(2).padStart(32, '0');
    const messageBinary = bytesToBitString(msgBytes);
    const fullBinary = headerBinary + lenBinary + messageBinary;

    // 3x redundancy
    const redundantBinary = fullBinary.split('').flatMap(b => [b, b, b]).join('');

    // capacity (we use blue-channel of ~30% pixels across frames)
    const totalPixels = frames.length * width * height;
    const embeddingRate = 0.3;
    const capacityBits = Math.floor(totalPixels * embeddingRate);
    if (redundantBinary.length > capacityBits) {
      throw new Error('Message too large for this video');
    }

    if (onProgress) onProgress(50);

    // PRNG seed (use CryptoJS.SHA256 if password given to match your previous code)
    const seed = password ? CryptoJS.SHA256(password).toString() : 'default-seed';
    // embed across frames, using a frame-specific PRNG to choose pixels
    let bitIndex = 0;
    for (let frameIdx = 0; frameIdx < frames.length && bitIndex < redundantBinary.length; frameIdx++) {
      const frame = frames[frameIdx];
      const data = frame.data; // RGBA
      const pixels = data.length / 4;

      // frame-specific deterministic PRNG
      const framePrng = seededPRNG(seed + ':' + frameIdx);
      // estimate available bits this frame will contribute (unique indices)
      const availableThisFrame = Math.min(Math.ceil(pixels * embeddingRate), redundantBinary.length - bitIndex);
      const pixelIndices = generateIndicesPRNG(framePrng, pixels, availableThisFrame);

      for (let pi = 0; pi < pixelIndices.length && bitIndex < redundantBinary.length; pi++) {
        const pixel = pixelIndices[pi];
        const blueIdx = pixel * 4 + 2;
        const bit = parseInt(redundantBinary[bitIndex], 10);
        data[blueIdx] = (data[blueIdx] & 0xFE) | bit;
        bitIndex++;
      }
    }

    if (onProgress) onProgress(80);

    const videoBlob = await this.framesToVideo(frames, fps, width, height);

    if (onProgress) onProgress(100);
    return videoBlob;
  }

  static async decode(file: File, password?: string, onProgress?: (progress: number) => void): Promise<string | null> {
    try {
      if (onProgress) onProgress(10);
      const { frames, width, height } = await this.videoToFrames(file);
      if (onProgress) onProgress(40);

      const embeddingRate = 0.3;
      const redundancy = 3;
      const headerBinary = bytesToBitString(new Uint8Array('VSTEGA1'.split('').map(c => c.charCodeAt(0))));

      const seed = password ? CryptoJS.SHA256(password).toString() : 'default-seed';

      // We'll collect a redundant bit stream by iterating frames in same deterministic way
      let redundantStream = '';
      for (let frameIdx = 0; frameIdx < frames.length; frameIdx++) {
        const frame = frames[frameIdx];
        const data = frame.data;
        const pixels = data.length / 4;
        const framePrng = seededPRNG(seed + ':' + frameIdx);
        const maxThisFrame = Math.ceil(pixels * embeddingRate);
        const pixelIndices = generateIndicesPRNG(framePrng, pixels, maxThisFrame);

        for (let p = 0; p < pixelIndices.length; p++) {
          const blueIndex = pixelIndices[p] * 4 + 2;
          const bit = (data[blueIndex] & 1).toString();
          redundantStream += bit;

          // Try early decode when we have at least header + length worth of decoded bits (after majority)
          const minRedundant = (headerBinary.length + 32) * redundancy;
          if (redundantStream.length >= minRedundant) {
            const decoded = decodeRedundantBits(redundantStream);
            const headerIdx = decoded.indexOf(headerBinary);
            if (headerIdx !== -1 && decoded.length >= headerIdx + headerBinary.length + 32) {
              const lenBits = decoded.substr(headerIdx + headerBinary.length, 32);
              const msgLen = parseInt(lenBits, 2);
              const totalMsgBits = msgLen * 8;
              if (decoded.length >= headerIdx + headerBinary.length + 32 + totalMsgBits) {
                const messageBits = decoded.substr(headerIdx + headerBinary.length + 32, totalMsgBits);
                const msgBytes = bitStringToBytes(messageBits);
                const decodedMessage = new TextDecoder().decode(msgBytes);
                if (password) {
                  try {
                    const decrypted = CryptoJS.AES.decrypt(decodedMessage, password);
                    const decryptedMessage = decrypted.toString(CryptoJS.enc.Utf8);
                    return decryptedMessage || null;
                  } catch {
                    return null;
                  }
                }
                return decodedMessage;
              }
            }
          }
        }
        if (onProgress) onProgress(40 + Math.floor(60 * (frameIdx / frames.length)));
      }

      // Final attempt after collecting all bits
      const decodedAll = decodeRedundantBits(redundantStream);
      const headerIdx = decodedAll.indexOf(headerBinary);
      if (headerIdx === -1) return null;
      const lenBits = decodedAll.substr(headerIdx + headerBinary.length, 32);
      const msgLen = parseInt(lenBits, 2);
      const totalMsgBits = msgLen * 8;
      const messageBits = decodedAll.substr(headerIdx + headerBinary.length + 32, totalMsgBits);
      if (messageBits.length < totalMsgBits) return null;
      const msgBytes = bitStringToBytes(messageBits);
      const decodedMessage = new TextDecoder().decode(msgBytes);
      if (password) {
        try {
          const decrypted = CryptoJS.AES.decrypt(decodedMessage, password);
          const decryptedMessage = decrypted.toString(CryptoJS.enc.Utf8);
          return decryptedMessage || null;
        } catch {
          return null;
        }
      }
      return decodedMessage;
    } catch {
      return null;
    }
  }

  private static decodeRedundantBits(redundantBits: string): string {
    return decodeRedundantBits(redundantBits);
  }

  static async calculateCapacity(file: File): Promise<number> {
    try {
      const { frames, width, height } = await this.videoToFrames(file);
      const totalPixels = frames.length * width * height;
      const embeddingRate = 0.3;
      const redundancy = 3;
      const capacityBits = Math.floor(totalPixels * embeddingRate);
      const payloadBits = Math.floor(capacityBits / redundancy);
      const payloadBytes = Math.floor(payloadBits / 8);
      // subtract overhead (7 bytes header + 4 bytes length)
      return Math.max(0, payloadBytes - (7 + 4));
    } catch {
      return 0;
    }
  }
}
