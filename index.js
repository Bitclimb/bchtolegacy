/***
 * @license
 * https://github.com/bitcoincashjs/bchaddr
 * Copyright (c) 2018 Emilio Almansi
 * Distributed under the MIT software license, see the accompanying
 * file LICENSE or http://www.opensource.org/licenses/mit-license.php.
 */

import * as Base58check from 'bs58check';

import { encode, decode } from 'cashaddrjs';
const b58enc = Base58check.encode;
const b58dec = Base58check.decode;
/**
 * General purpose Bitcoin Cash address detection and translation.<br />
 * Supports all major Bitcoin Cash address formats.<br />
 * Currently:
 * <ul>
 *    <li> Legacy format </li>
 *    <li> Bitpay format </li>
 *    <li> Cashaddr format </li>
 * </ul>
 * @module bchaddr
 */

/**
 * @static
 * Supported Bitcoin Cash address formats.
 */
const Format = {};
Format.Legacy = 'legacy';
Format.Cashaddr = 'cashaddr';

/**
 * @static
 * Supported networks.
 */
const Network = {};
Network.Mainnet = 'mainnet';
Network.Testnet = 'testnet';

/**
 * @static
 * Supported address types.
 */
const Type = {};
Type.P2PKH = 'p2pkh';
Type.P2SH = 'p2sh';

/**
 * Translates the given address into legacy format.
 * @static
 * @param {string} address - A valid Bitcoin Cash address in any format.
 * @return {string}
 * @throws {InvalidAddressError}
 */
function toLegacyAddress(address) {
  const decoded = decodeAddress(address);
  if (decoded.format === Format.Legacy) {
    return address;
  }
  return encodeAsLegacy(decoded);
}

/**
 * Translates the given address into cashaddr format.
 * @static
 * @param {string} address - A valid Bitcoin Cash address in any format.
 * @return {string}
 * @throws {InvalidAddressError}
 */
function toCashAddress(address) {
  const decoded = decodeAddress(address);
  if (decoded.format === Format.Cashaddr) {
    return address;
  }
  return encodeAsCashaddr(decoded);
}

/**
 * Version byte table for base58 formats.
 * @private
 */
const VERSION_BYTE = {};
VERSION_BYTE[Format.Legacy] = {};
VERSION_BYTE[Format.Legacy][Network.Mainnet] = {};
VERSION_BYTE[Format.Legacy][Network.Mainnet][Type.P2PKH] = 0;
VERSION_BYTE[Format.Legacy][Network.Mainnet][Type.P2SH] = 5;
VERSION_BYTE[Format.Legacy][Network.Testnet] = {};
VERSION_BYTE[Format.Legacy][Network.Testnet][Type.P2PKH] = 111;
VERSION_BYTE[Format.Legacy][Network.Testnet][Type.P2SH] = 196;

/**
 * Decodes the given address into its constituting hash, format, network and type.
 * @private
 * @param {string} address - A valid Bitcoin Cash address in any format.
 * @return {object}
 * @throws {InvalidAddressError}
 */
function decodeAddress(address) {
  try {
    return decodeBase58Address(address);
  } catch (error) {}
  try {
    return decodeCashAddress(address);
  } catch (error) {}
  throw new InvalidAddressError();
}

/**
 * Attempts to decode the given address assuming it is a base58 address.
 * @private
 * @param {string} address - A valid Bitcoin Cash address in any format.
 * @return {object}
 * @throws {InvalidAddressError}
 */
function decodeBase58Address(address) {
  try {
    const payload = b58dec(address);
    const versionByte = payload[0];
    const hash = Array.prototype.slice.call(payload, 1);
    switch (versionByte) {
      case VERSION_BYTE[Format.Legacy][Network.Mainnet][Type.P2PKH]:
        return {
          hash,
          format: Format.Legacy,
          network: Network.Mainnet,
          type: Type.P2PKH
        };
      case VERSION_BYTE[Format.Legacy][Network.Mainnet][Type.P2SH]:
        return {
          hash,
          format: Format.Legacy,
          network: Network.Mainnet,
          type: Type.P2SH
        };
      case VERSION_BYTE[Format.Legacy][Network.Testnet][Type.P2PKH]:
        return {
          hash,
          format: Format.Legacy,
          network: Network.Testnet,
          type: Type.P2PKH
        };
      case VERSION_BYTE[Format.Legacy][Network.Testnet][Type.P2SH]:
        return {
          hash,
          format: Format.Legacy,
          network: Network.Testnet,
          type: Type.P2SH
        };
    }
  } catch (error) {}
  throw new InvalidAddressError();
}

/**
 * Attempts to decode the given address assuming it is a cashaddr address.
 * @private
 * @param {string} address - A valid Bitcoin Cash address in any format.
 * @return {object}
 * @throws {InvalidAddressError}
 */
function decodeCashAddress(address) {
  if (address.includes(':')) {
    try {
      return decodeCashAddressWithPrefix(address);
    } catch (error) {}
  } else {
    const prefixes = ['bitcoincash', 'bchtest', 'regtest'];
    for (let i = 0; i < prefixes.length; ++i) {
      try {
        const prefix = prefixes[i];
        return decodeCashAddressWithPrefix(`${prefix}:${address}`);
      } catch (error) {}
    }
  }
  throw new InvalidAddressError();
}

/**
 * Attempts to decode the given address assuming it is a cashaddr address with explicit prefix.
 * @private
 * @param {string} address - A valid Bitcoin Cash address in any format.
 * @return {object}
 * @throws {InvalidAddressError}
 */
function decodeCashAddressWithPrefix(address) {
  try {
    const decoded = decode(address);
    const hash = Array.prototype.slice.call(decoded.hash, 0);
    const type = decoded.type === 'P2PKH' ? Type.P2PKH : Type.P2SH;
    switch (decoded.prefix) {
      case 'bitcoincash':
        return {
          hash,
          format: Format.Cashaddr,
          network: Network.Mainnet,
          type
        };
      case 'bchtest':
      case 'regtest':
        return {
          hash,
          format: Format.Cashaddr,
          network: Network.Testnet,
          type
        };
    }
  } catch (error) {}
  throw new InvalidAddressError();
}

/**
 * Encodes the given decoded address into legacy format.
 * @private
 * @param {object} decoded
 * @returns {string}
 */
function encodeAsLegacy(decoded) {
  const versionByte = VERSION_BYTE[Format.Legacy][decoded.network][decoded.type];
  const buffer = Buffer.alloc(1 + decoded.hash.length);
  buffer[0] = versionByte;
  buffer.set(decoded.hash, 1);
  return b58enc(buffer);
}

/**
 * Encodes the given decoded address into cashaddr format.
 * @private
 * @param {object} decoded
 * @returns {string}
 */
function encodeAsCashaddr(decoded) {
  const prefix = decoded.network === Network.Mainnet ? 'bitcoincash' : 'bchtest';
  const type = decoded.type === Type.P2PKH ? 'P2PKH' : 'P2SH';
  const hash = Uint8Array.from(decoded.hash);
  return encode(prefix, type, hash);
}

/**
 * Error thrown when the address given as input is not a valid Bitcoin Cash address.
 * @constructor
 * InvalidAddressError
 */
class InvalidAddressError extends Error {
  constructor() {
    const error = new Error();
    super();
    this.name = error.name = 'InvalidAddressError';
    this.message = error.message = 'Received an invalid Bitcoin Cash address as input.';
    this.stack = error.stack;
  }
}

export default {
  toLegacyAddress,
  toCashAddress
};
