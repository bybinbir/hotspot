import { Injectable } from '@nestjs/common';
import { NasType } from '../../database/entities';

export interface RadiusAttribute {
  attribute: string;
  op: string;
  value: string;
}

@Injectable()
export class VendorAttributesService {
  /**
   * Generate bandwidth control attributes based on NAS device type.
   *
   * Speed parameters are in Kbps. Each vendor expects a different format:
   *  - Mikrotik: single rate-limit string "upload/download"
   *  - Cisco: AVPair with rate-limit in bps and burst calculation
   *  - Juniper: ingress/egress policy names referencing pre-configured policies
   *  - Generic: WISPr attributes in bits per second
   */
  generateBandwidthAttributes(
    nasType: NasType,
    downloadSpeedKbps: number,
    uploadSpeedKbps: number,
  ): RadiusAttribute[] {
    switch (nasType) {
      case NasType.MIKROTIK:
        return this.buildMikrotikBandwidth(downloadSpeedKbps, uploadSpeedKbps);
      case NasType.CISCO:
        return this.buildCiscoBandwidth(downloadSpeedKbps, uploadSpeedKbps);
      case NasType.JUNIPER:
        return this.buildJuniperBandwidth(downloadSpeedKbps, uploadSpeedKbps);
      case NasType.GENERIC:
      default:
        return this.buildGenericBandwidth(downloadSpeedKbps, uploadSpeedKbps);
    }
  }

  /**
   * Generate session control attributes (common for all vendors).
   *
   * - Simultaneous-Use: max concurrent sessions
   * - Session-Timeout / Max-All-Session: cumulative time limit (minutes → seconds)
   * - ChilliSpot-Max-Total-Octets: data cap in bytes
   */
  generateSessionAttributes(
    simultaneousSessions: number,
    timeLimitMinutes: number | null,
    dataLimitBytes: string | null,
  ): RadiusAttribute[] {
    const attributes: RadiusAttribute[] = [];

    if (simultaneousSessions > 0) {
      attributes.push({
        attribute: 'Simultaneous-Use',
        op: ':=',
        value: String(simultaneousSessions),
      });
    }

    if (timeLimitMinutes !== null && timeLimitMinutes > 0) {
      const seconds = timeLimitMinutes * 60;
      attributes.push(
        {
          attribute: 'Session-Timeout',
          op: ':=',
          value: String(seconds),
        },
        {
          attribute: 'Max-All-Session',
          op: ':=',
          value: String(seconds),
        },
      );
    }

    if (dataLimitBytes !== null && dataLimitBytes !== '0') {
      attributes.push({
        attribute: 'ChilliSpot-Max-Total-Octets',
        op: ':=',
        value: dataLimitBytes,
      });
    }

    return attributes;
  }

  /**
   * Generate the full set of reply attributes for a package by combining
   * vendor-specific bandwidth attributes with common session attributes.
   */
  generatePackageAttributes(
    nasType: NasType,
    pkg: {
      downloadSpeed: number;
      uploadSpeed: number;
      simultaneousSessions: number;
      timeLimit: number | null;
      dataLimit: string | null;
    },
  ): RadiusAttribute[] {
    const bandwidthAttrs = this.generateBandwidthAttributes(
      nasType,
      pkg.downloadSpeed,
      pkg.uploadSpeed,
    );

    const sessionAttrs = this.generateSessionAttributes(
      pkg.simultaneousSessions,
      pkg.timeLimit,
      pkg.dataLimit,
    );

    return [...bandwidthAttrs, ...sessionAttrs];
  }

  // ---------------------------------------------------------------------------
  // Vendor-specific bandwidth builders
  // ---------------------------------------------------------------------------

  /**
   * Mikrotik uses a single attribute with "upload/download" in Kbps notation.
   * Example: 5 Mbps up / 10 Mbps down → "5120k/10240k"
   */
  private buildMikrotikBandwidth(
    downloadKbps: number,
    uploadKbps: number,
  ): RadiusAttribute[] {
    return [
      {
        attribute: 'Mikrotik-Rate-Limit',
        op: ':=',
        value: `${uploadKbps}k/${downloadKbps}k`,
      },
    ];
  }

  /**
   * Cisco uses AVPair with rate-limit commands.
   * Speeds are converted to bps (Kbps * 1000).
   * Burst size is 1.5x the speed in bytes.
   */
  private buildCiscoBandwidth(
    downloadKbps: number,
    uploadKbps: number,
  ): RadiusAttribute[] {
    const downloadBps = downloadKbps * 1000;
    const uploadBps = uploadKbps * 1000;
    const downloadBurst = Math.round(downloadBps * 1.5);
    const uploadBurst = Math.round(uploadBps * 1.5);

    return [
      {
        attribute: 'Cisco-AVPair',
        op: '+=',
        value: `lcp:interface-config#1=rate-limit input ${downloadBps} ${downloadBurst} conform-action transmit exceed-action drop`,
      },
      {
        attribute: 'Cisco-AVPair',
        op: '+=',
        value: `lcp:interface-config#2=rate-limit output ${uploadBps} ${uploadBurst} conform-action transmit exceed-action drop`,
      },
    ];
  }

  /**
   * Juniper uses ingress/egress policy names that reference
   * pre-configured policies on the device.
   */
  private buildJuniperBandwidth(
    downloadKbps: number,
    uploadKbps: number,
  ): RadiusAttribute[] {
    return [
      {
        attribute: 'ERX-Ingress-Policy-Name',
        op: ':=',
        value: `rate-${downloadKbps}`,
      },
      {
        attribute: 'ERX-Egress-Policy-Name',
        op: ':=',
        value: `rate-${uploadKbps}`,
      },
    ];
  }

  /**
   * Generic (WISPr) uses standard RADIUS attributes in bits per second.
   */
  private buildGenericBandwidth(
    downloadKbps: number,
    uploadKbps: number,
  ): RadiusAttribute[] {
    const downloadBps = downloadKbps * 1000;
    const uploadBps = uploadKbps * 1000;

    return [
      {
        attribute: 'WISPr-Bandwidth-Max-Down',
        op: ':=',
        value: String(downloadBps),
      },
      {
        attribute: 'WISPr-Bandwidth-Max-Up',
        op: ':=',
        value: String(uploadBps),
      },
    ];
  }
}
