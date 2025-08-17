import CryptoJS from 'crypto-js';

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