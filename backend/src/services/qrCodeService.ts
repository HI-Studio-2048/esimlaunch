import QRCode from 'qrcode';

export interface QRCodeData {
  esimTranNo: string;
  iccid?: string;
  imsi?: string;
  activationCode?: string;
  qrCodeUrl?: string; // If eSIM Access provides QR code URL
}

export const qrCodeService = {
  /**
   * Generate QR code from eSIM profile data
   * Returns QR code as data URL (base64 image)
   */
  async generateQRCode(data: QRCodeData): Promise<string> {
    // If eSIM Access provides QR code URL, use it
    if (data.qrCodeUrl) {
      return data.qrCodeUrl;
    }

    // Otherwise, generate QR code from profile data
    // QR code typically contains LPA activation code or SM-DP+ server info
    const qrData = data.activationCode || data.esimTranNo || data.iccid || '';

    try {
      const qrCodeDataUrl = await QRCode.toDataURL(qrData, {
        errorCorrectionLevel: 'M',
        type: 'image/png',
        width: 300,
        margin: 1,
      });

      return qrCodeDataUrl;
    } catch (error) {
      console.error('Error generating QR code:', error);
      throw new Error('Failed to generate QR code');
    }
  },

  /**
   * Generate QR code as image buffer (for email attachments)
   */
  async generateQRCodeImage(data: QRCodeData): Promise<Buffer> {
    // If eSIM Access provides QR code URL, fetch it
    if (data.qrCodeUrl) {
      const response = await fetch(data.qrCodeUrl);
      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    }

    // Otherwise, generate QR code
    const qrData = data.activationCode || data.esimTranNo || data.iccid || '';

    try {
      const qrCodeBuffer = await QRCode.toBuffer(qrData, {
        errorCorrectionLevel: 'M',
        type: 'image/png',
        width: 300,
        margin: 1,
      });

      return qrCodeBuffer;
    } catch (error) {
      console.error('Error generating QR code buffer:', error);
      throw new Error('Failed to generate QR code');
    }
  },

  /**
   * Generate multiple QR codes for an order
   */
  async generateQRCodes(profiles: QRCodeData[]): Promise<string[]> {
    const qrCodes = await Promise.all(
      profiles.map(profile => this.generateQRCode(profile))
    );
    return qrCodes;
  },
};





