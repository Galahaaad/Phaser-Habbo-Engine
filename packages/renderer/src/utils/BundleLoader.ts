import pako from 'pako';

export interface BundleFile {
  name: string;
  data: Uint8Array;
  type: 'json' | 'png';
}

export class BundleLoader {
  public static async loadBundle(url: string): Promise<BundleFile[]> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to load bundle: ${url}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const files = this.parseBundle(arrayBuffer);
    return files;
  }

  private static parseBundle(arrayBuffer: ArrayBuffer): BundleFile[] {
    const view = new DataView(arrayBuffer);
    let offset = 0;

    const fileCount = view.getUint16(offset, false);
    offset += 2;

    const files: BundleFile[] = [];

    for (let i = 0; i < fileCount; i++) {
      const nameLength = view.getUint16(offset, false);
      offset += 2;

      const nameBytes = new Uint8Array(arrayBuffer, offset, nameLength);
      const name = new TextDecoder().decode(nameBytes);
      offset += nameLength;

      const dataLength = view.getUint32(offset, false);
      offset += 4;

      const compressedData = new Uint8Array(arrayBuffer, offset, dataLength);
      offset += dataLength;

      const decompressedData = pako.inflate(compressedData);

      const type = name.endsWith('.json') ? 'json' : 'png';

      files.push({
        name,
        data: decompressedData,
        type
      });
    }

    return files;
  }

  public static arrayBufferToBase64(buffer: Uint8Array): string {
    let binary = '';
    const len = buffer.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(buffer[i]);
    }
    return btoa(binary);
  }

  public static parseJSON(data: Uint8Array): any {
    const text = new TextDecoder().decode(data);
    return JSON.parse(text);
  }
}
