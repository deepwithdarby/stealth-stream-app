import CryptoJS from 'crypto-js';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

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

    // Check if cover text has enough capacity
    const requiredLength = Math.ceil(binaryWithMarker.length / 2);
    if (coverText.length < requiredLength) {
      throw new Error(`Cover text too short. Needs ${requiredLength} characters, but has ${coverText.length}.`);
    }

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

// Audio Steganography using LSB on PCM data
export class AudioSteganography {
  private static ffmpeg: FFmpeg | null = null;

  private static async initFFmpeg(): Promise<FFmpeg> {
    if (!this.ffmpeg) {
      this.ffmpeg = new FFmpeg();
      
      const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
      await this.ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
      });
    }
    return this.ffmpeg;
  }

  private static async deriveKeyFromPassword(password: string): Promise<{ salt: Uint8Array, key: CryptoKey }> {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    // For demo purposes, using a simplified key derivation
    const keyMaterial = new TextEncoder().encode(password + salt.join(''));
    const key = await crypto.subtle.importKey('raw', keyMaterial.slice(0, 32), 'AES-GCM', false, ['encrypt', 'decrypt']);
    return { salt, key };
  }

  private static seededPRNG(seed: string) {
    let state = 0;
    for (let i = 0; i < seed.length; i++) {
      state = (state * 31 + seed.charCodeAt(i)) >>> 0;
    }
    
    return () => {
      state = (state * 1664525 + 1013904223) >>> 0;
      return state / 0x100000000;
    };
  }

  private static async fileToAudioBuffer(file: File): Promise<{ buffer: AudioBuffer, originalFormat: string }> {
    const arrayBuffer = await file.arrayBuffer();
    
    try {
      // Try direct audio decoding first
      const audioContext = new AudioContext();
      const buffer = await audioContext.decodeAudioData(arrayBuffer.slice());
      audioContext.close();
      return { buffer, originalFormat: file.type };
    } catch {
      // Fallback to FFmpeg for unsupported formats
      const ffmpeg = await this.initFFmpeg();
      const inputName = `input.${file.name.split('.').pop()}`;
      const outputName = 'output.wav';
      
      await ffmpeg.writeFile(inputName, new Uint8Array(arrayBuffer));
      await ffmpeg.exec(['-i', inputName, '-f', 'wav', '-ac', '1', '-ar', '44100', outputName]);
      
      const wavData = await ffmpeg.readFile(outputName) as Uint8Array;
      const wavBuffer = new ArrayBuffer(wavData.length);
      new Uint8Array(wavBuffer).set(wavData);
      
      const audioContext = new AudioContext();
      const buffer = await audioContext.decodeAudioData(wavBuffer);
      audioContext.close();
      
      return { buffer, originalFormat: 'converted' };
    }
  }

  private static audioBufferToInt16Array(buffer: AudioBuffer): Int16Array {
    const samples = buffer.getChannelData(0); // Use first channel
    const int16Samples = new Int16Array(samples.length);
    
    for (let i = 0; i < samples.length; i++) {
      const sample = Math.max(-1, Math.min(1, samples[i]));
      int16Samples[i] = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
    }
    
    return int16Samples;
  }

  private static int16ArrayToWav(samples: Int16Array, sampleRate: number): ArrayBuffer {
    const length = samples.length;
    const buffer = new ArrayBuffer(44 + length * 2);
    const view = new DataView(buffer);
    
    // WAV header
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
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
    
    // PCM data
    for (let i = 0; i < length; i++) {
      view.setInt16(44 + i * 2, samples[i], true);
    }
    
    return buffer;
  }

  static async encode(file: File, secretMessage: string, password?: string): Promise<Blob> {
    const { buffer } = await this.fileToAudioBuffer(file);
    const samples = this.audioBufferToInt16Array(buffer);
    
    let messageToEncode = secretMessage;
    
    // Encrypt if password provided
    if (password) {
      messageToEncode = CryptoJS.AES.encrypt(secretMessage, password).toString();
    }

    // Convert message to binary with header
    const messageBinary = messageToEncode
      .split('')
      .map(char => char.charCodeAt(0).toString(2).padStart(8, '0'))
      .join('');
    
    const header = 'USTEGA1';
    const headerBinary = header
      .split('')
      .map(char => char.charCodeAt(0).toString(2).padStart(8, '0'))
      .join('');
    
    const endMarker = '1111111111111110';
    const fullBinary = headerBinary + messageBinary + endMarker;
    
    // Apply 3x redundancy
    const redundantBinary = fullBinary.split('').flatMap(bit => [bit, bit, bit]).join('');
    
    // Check capacity
    const capacity = Math.floor(samples.length * 0.8); // Use 80% of samples for safety
    if (redundantBinary.length > capacity) {
      throw new Error('Message too large for this audio file');
    }

    // Generate PRNG for sample indices
    const seed = password ? CryptoJS.SHA256(password).toString() : 'default-seed';
    const prng = this.seededPRNG(seed);
    
    // Create permutation of sample indices
    const indices: number[] = [];
    const used = new Set<number>();
    
    for (let i = 0; i < redundantBinary.length; i++) {
      let idx;
      do {
        idx = Math.floor(prng() * samples.length);
      } while (used.has(idx));
      used.add(idx);
      indices.push(idx);
    }

    // Embed bits in LSB
    const modifiedSamples = new Int16Array(samples);
    for (let i = 0; i < redundantBinary.length; i++) {
      const sampleIndex = indices[i];
      const bit = parseInt(redundantBinary[i]);
      modifiedSamples[sampleIndex] = (modifiedSamples[sampleIndex] & 0xFFFE) | bit;
    }

    // Export as WAV
    const wavBuffer = this.int16ArrayToWav(modifiedSamples, buffer.sampleRate);
    return new Blob([wavBuffer], { type: 'audio/wav' });
  }

  static async decode(file: File, password?: string): Promise<string | null> {
    try {
      const { buffer } = await this.fileToAudioBuffer(file);
      const samples = this.audioBufferToInt16Array(buffer);
      
      // Generate same PRNG sequence
      const seed = password ? CryptoJS.SHA256(password).toString() : 'default-seed';
      const prng = this.seededPRNG(seed);
      
      // Extract bits using same index pattern
      let extractedBits = '';
      const used = new Set<number>();
      
      // Extract more bits than minimum to find the end marker
      const maxBits = Math.min(10000, Math.floor(samples.length * 0.8));
      
      for (let i = 0; i < maxBits; i++) {
        let idx;
        do {
          idx = Math.floor(prng() * samples.length);
        } while (used.has(idx));
        used.add(idx);
        
        const bit = samples[idx] & 1;
        extractedBits += bit;
        
        // Check for end marker in the redundant stream
        if (extractedBits.length >= 48) { // Header + some data minimum
          const decoded = this.decodeRedundantBits(extractedBits);
          if (decoded && decoded.includes('1111111111111110')) {
            extractedBits = decoded;
            break;
          }
        }
      }
      
      // Decode redundancy (majority vote)
      if (extractedBits.length < 48) {
        extractedBits = this.decodeRedundantBits(extractedBits);
      }
      
      // Find header
      const headerBinary = 'USTEGA1'
        .split('')
        .map(char => char.charCodeAt(0).toString(2).padStart(8, '0'))
        .join('');
      
      const headerIndex = extractedBits.indexOf(headerBinary);
      if (headerIndex === -1) {
        return null;
      }
      
      // Find end marker
      const endMarker = '1111111111111110';
      const endIndex = extractedBits.indexOf(endMarker, headerIndex + headerBinary.length);
      if (endIndex === -1) {
        return null;
      }
      
      // Extract message
      const messageBinary = extractedBits.substring(headerIndex + headerBinary.length, endIndex);
      
      // Convert to text
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
          return null;
        }
      }
      
      return decodedMessage;
    } catch {
      return null;
    }
  }

  private static decodeRedundantBits(redundantBits: string): string {
    let decoded = '';
    for (let i = 0; i < redundantBits.length; i += 3) {
      const triplet = redundantBits.substr(i, 3);
      if (triplet.length === 3) {
        // Majority vote
        const ones = (triplet.match(/1/g) || []).length;
        decoded += ones >= 2 ? '1' : '0';
      }
    }
    return decoded;
  }

  static calculateCapacity(file: File): Promise<number> {
    return this.fileToAudioBuffer(file).then(({ buffer }) => {
      const samples = this.audioBufferToInt16Array(buffer);
      const capacity = Math.floor(samples.length * 0.8 / 3); // Account for 3x redundancy
      return Math.floor(capacity / 8) - 20; // Bytes minus header overhead
    });
  }
}

// Video Steganography using LSB on frames
export class VideoSteganography {
  private static ffmpeg: FFmpeg | null = null;

  private static async initFFmpeg(): Promise<FFmpeg> {
    if (!this.ffmpeg) {
      this.ffmpeg = new FFmpeg();
      
      const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
      await this.ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
      });
    }
    return this.ffmpeg;
  }

  private static seededPRNG(seed: string) {
    let state = 0;
    for (let i = 0; i < seed.length; i++) {
      state = (state * 31 + seed.charCodeAt(i)) >>> 0;
    }
    
    return () => {
      state = (state * 1664525 + 1013904223) >>> 0;
      return state / 0x100000000;
    };
  }

  private static async videoToFrames(file: File): Promise<{ frames: ImageData[], fps: number, width: number, height: number }> {
    const ffmpeg = await this.initFFmpeg();
    const inputName = `input.${file.name.split('.').pop()}`;
    
    await ffmpeg.writeFile(inputName, await fetchFile(file));
    
    // Extract frames as PNG images (limit to first 30 seconds for performance)
    await ffmpeg.exec([
      '-i', inputName,
      '-t', '30',
      '-vf', 'scale=640:480,fps=10', // Limit resolution and fps for performance
      '-f', 'image2',
      'frame_%03d.png'
    ]);
    
    const frames: ImageData[] = [];
    let frameIndex = 1;
    
    // Read frames until no more exist
    while (true) {
      try {
        const frameData = await ffmpeg.readFile(`frame_${frameIndex.toString().padStart(3, '0')}.png`) as Uint8Array;
        
        // Convert PNG to ImageData
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;
        const img = new Image();
        
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = URL.createObjectURL(new Blob([frameData], { type: 'image/png' }));
        });
        
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        frames.push(imageData);
        
        URL.revokeObjectURL(img.src);
        frameIndex++;
      } catch {
        break; // No more frames
      }
    }
    
    return { frames, fps: 10, width: 640, height: 480 };
  }

  private static async framesToVideo(frames: ImageData[], fps: number, width: number, height: number): Promise<Blob> {
    const ffmpeg = await this.initFFmpeg();
    
    // Convert frames back to PNG files
    for (let i = 0; i < frames.length; i++) {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d')!;
      ctx.putImageData(frames[i], 0, 0);
      
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => resolve(blob!), 'image/png');
      });
      
      const frameData = new Uint8Array(await blob.arrayBuffer());
      await ffmpeg.writeFile(`frame_${i.toString().padStart(3, '0')}.png`, frameData);
    }
    
    // Encode to lossless WebM
    await ffmpeg.exec([
      '-r', fps.toString(),
      '-i', 'frame_%03d.png',
      '-c:v', 'libvpx-vp9',
      '-lossless', '1',
      '-an', // No audio
      'output.webm'
    ]);
    
    const videoData = await ffmpeg.readFile('output.webm') as Uint8Array;
    return new Blob([videoData], { type: 'video/webm' });
  }

  static async encode(file: File, secretMessage: string, password?: string, onProgress?: (progress: number) => void): Promise<Blob> {
    if (onProgress) onProgress(10);
    
    const { frames, fps, width, height } = await this.videoToFrames(file);
    
    if (onProgress) onProgress(30);
    
    let messageToEncode = secretMessage;
    
    // Encrypt if password provided
    if (password) {
      messageToEncode = CryptoJS.AES.encrypt(secretMessage, password).toString();
    }

    // Convert message to binary with header
    const messageBinary = messageToEncode
      .split('')
      .map(char => char.charCodeAt(0).toString(2).padStart(8, '0'))
      .join('');
    
    const header = 'VSTEGA1';
    const headerBinary = header
      .split('')
      .map(char => char.charCodeAt(0).toString(2).padStart(8, '0'))
      .join('');
    
    const endMarker = '1111111111111110';
    const fullBinary = headerBinary + messageBinary + endMarker;
    
    // Apply 3x redundancy
    const redundantBinary = fullBinary.split('').flatMap(bit => [bit, bit, bit]).join('');
    
    // Calculate total capacity
    const totalPixels = frames.length * width * height;
    const capacity = Math.floor(totalPixels * 0.3); // Use 30% of blue channel pixels
    
    if (redundantBinary.length > capacity) {
      throw new Error('Message too large for this video');
    }

    if (onProgress) onProgress(50);

    // Generate PRNG for pixel indices
    const seed = password ? CryptoJS.SHA256(password).toString() : 'default-seed';
    const prng = this.seededPRNG(seed);
    
    // Embed across all frames
    let bitIndex = 0;
    
    for (let frameIdx = 0; frameIdx < frames.length && bitIndex < redundantBinary.length; frameIdx++) {
      const frame = frames[frameIdx];
      const data = frame.data;
      
      // Reset PRNG for consistent pattern across frames
      const framePrng = this.seededPRNG(seed + frameIdx);
      
      for (let i = 0; i < data.length && bitIndex < redundantBinary.length; i += 4) {
        // Use blue channel (index 2) and skip some pixels randomly
        if (framePrng() < 0.3) { // 30% embedding rate
          const blueIndex = i + 2;
          const bit = parseInt(redundantBinary[bitIndex]);
          data[blueIndex] = (data[blueIndex] & 0xFE) | bit;
          bitIndex++;
        }
      }
    }

    if (onProgress) onProgress(80);

    // Convert frames back to video
    const videoBlob = await this.framesToVideo(frames, fps, width, height);
    
    if (onProgress) onProgress(100);
    
    return videoBlob;
  }

  static async decode(file: File, password?: string, onProgress?: (progress: number) => void): Promise<string | null> {
    try {
      if (onProgress) onProgress(10);
      
      const { frames, width, height } = await this.videoToFrames(file);
      
      if (onProgress) onProgress(40);
      
      // Generate same PRNG sequence
      const seed = password ? CryptoJS.SHA256(password).toString() : 'default-seed';
      
      // Extract bits from all frames
      let extractedBits = '';
      
      for (let frameIdx = 0; frameIdx < frames.length; frameIdx++) {
        const frame = frames[frameIdx];
        const data = frame.data;
        
        const framePrng = this.seededPRNG(seed + frameIdx);
        
        for (let i = 0; i < data.length; i += 4) {
          if (framePrng() < 0.3) { // Same 30% pattern
            const blueIndex = i + 2;
            const bit = data[blueIndex] & 1;
            extractedBits += bit;
            
            // Check if we have enough for header + some data
            if (extractedBits.length >= 200) {
              const decoded = this.decodeRedundantBits(extractedBits);
              if (decoded.includes('VSTEGA1') && decoded.includes('1111111111111110')) {
                extractedBits = decoded;
                break;
              }
            }
          }
        }
        
        if (extractedBits.includes('1111111111111110')) break;
      }
      
      if (onProgress) onProgress(70);
      
      // Decode redundancy if not already done
      if (!extractedBits.includes('VSTEGA1')) {
        extractedBits = this.decodeRedundantBits(extractedBits);
      }
      
      // Find header
      const headerBinary = 'VSTEGA1'
        .split('')
        .map(char => char.charCodeAt(0).toString(2).padStart(8, '0'))
        .join('');
      
      const headerIndex = extractedBits.indexOf(headerBinary);
      if (headerIndex === -1) {
        return null;
      }
      
      // Find end marker
      const endMarker = '1111111111111110';
      const endIndex = extractedBits.indexOf(endMarker, headerIndex + headerBinary.length);
      if (endIndex === -1) {
        return null;
      }
      
      // Extract message
      const messageBinary = extractedBits.substring(headerIndex + headerBinary.length, endIndex);
      
      if (onProgress) onProgress(90);
      
      // Convert to text
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
          if (onProgress) onProgress(100);
          return decryptedMessage || null;
        } catch {
          return null;
        }
      }
      
      if (onProgress) onProgress(100);
      return decodedMessage;
    } catch {
      return null;
    }
  }

  private static decodeRedundantBits(redundantBits: string): string {
    let decoded = '';
    for (let i = 0; i < redundantBits.length; i += 3) {
      const triplet = redundantBits.substr(i, 3);
      if (triplet.length === 3) {
        // Majority vote
        const ones = (triplet.match(/1/g) || []).length;
        decoded += ones >= 2 ? '1' : '0';
      }
    }
    return decoded;
  }

  static async calculateCapacity(file: File): Promise<number> {
    try {
      const { frames, width, height } = await this.videoToFrames(file);
      const totalPixels = frames.length * width * height;
      const capacity = Math.floor(totalPixels * 0.3 / 3); // Account for 3x redundancy
      return Math.floor(capacity / 8) - 30; // Bytes minus header overhead
    } catch {
      return 0;
    }
  }
}