"use strict"

/**
 * ByteArray class
 * @author Zaseth
 */
class ByteArray {
  constructor() {
    this.buffer = Buffer.alloc(2048)
    this.writePosition = 0
    this.readPosition = 0
  }

  /**
   * Checks if you can write data
   * @param {Number} length
   * @returns {Boolean}
   */
  canWrite(length) {
    return this.buffer.length - this.writePosition >= length
  }

  /**
   * Scales the buffer if needed
   * @param {Number} length
   */
  scaleBuffer(length) {
    const oldBuffer = this.buffer

    this.buffer = Buffer.alloc(this.length + DEFAULT_SIZE + length)

    oldBuffer.copy(this.buffer)
  }

  /**
   * Writes a signed byte
   * @param {Number} value
   */
  writeByte(value) {
    if (!this.canWrite(1)) {
      this.scaleBuffer(1)
    }

    this.buffer.writeInt8(value, this.writePosition)

    this.writePosition += 1
  }

  /**
   * Writes a double
   * @param {Number} value
   */
  writeDouble(value) {
    if (!this.canWrite(8)) {
      this.scaleBuffer(8)
    }

    this.buffer.writeDoubleBE(value, this.writePosition)

    this.writePosition += 8
  }

  /**
   * Writes a UTF-8 string
   * @param {String} value
   */
  writeUTF(value) {
    const length = Buffer.byteLength(value)

    if (length > 65535) {
      throw new RangeError("ByteArray.writeUTF => Length can't be greater than 65535")
    }

    if (!this.canWrite(length)) {
      this.scaleBuffer(length)
    }

    this.writeUnsignedShort(length)

    this.buffer.write(value, this.writePosition, length)

    this.writePosition += length
  }

  /**
   * Writes an unsigned short
   * @param {Number} value
   */
  writeUnsignedShort(value) {
    if (!this.canWrite(2)) {
      this.scaleBuffer(2)
    }

    this.buffer.writeUInt16BE(value, this.writePosition)

    this.writePosition += 2
  }

  /**
   * Writes an unsigned int
   * @param {Number} value
   */
  writeUnsignedInt(value) {
    if (!this.canWrite(4)) {
      this.scaleBuffer(4)
    }

    this.buffer.writeUInt32BE(value, this.writePosition)

    this.writePosition += 4
  }

  /**
   * Writes multiple UTF-8 bytes
   * @param {String} value
   */
  writeUTFBytes(value) {
    const length = Buffer.byteLength(value)

    if (!this.canWrite(length)) {
      this.scaleBuffer(length)
    }

    this.buffer.write(value, this.writePosition, length)

    this.writePosition += length
  }

  /**
   * Writes a signed short
   * @param {Number} value
   */
  writeShort(value) {
    if (!this.canWrite(2)) {
      this.scaleBuffer(2)
    }

    this.buffer.writeInt16BE(value, this.writePosition)

    this.writePosition += 2
  }

  /**
   * Writes an unsigned int29
   * @param {Number} value
   */
  writeUInt29(value) {
    if (value < 0x80) {
      this.writeByte(value)
    } else if (value < 0x4000) {
      this.writeByte(((value >> 7) & 0x7f) | 0x80)
      this.writeByte(value & 0x7f)
    } else if (value < 0x200000) {
      this.writeByte(((value >> 14) & 0x7f) | 0x80)
      this.writeByte(((value >> 7) & 0x7f) | 0x80)
      this.writeByte(value & 0x7f)
    } else if (value < 0x40000000) {
      this.writeByte(((value >> 22) & 0x7f) | 0x80)
      this.writeByte(((value >> 15) & 0x7f) | 0x80)
      this.writeByte(((value >> 8) & 0x7f) | 0x80)
      this.writeByte(value & 0xff)
    } else {
      throw new RangeError(`ByteArray.writeUInt29 => Integer out of range: ${value}`)
    }
  }

  /**
   * Reads a signed byte
   * @returns {Number}
   */
  readByte() {
    const value = this.buffer.readInt8(this.readPosition)

    this.readPosition += 1

    return value
  }

  /**
   * Reads an unsigned byte
   * @returns {Number}
   */
  readUnsignedByte() {
    const value = this.buffer.readUInt8(this.readPosition)

    this.readPosition += 1

    return value
  }

  /**
   * Reads a double
   * @returns {Number}
   */
  readDouble() {
    const value = this.buffer.readDoubleBE(this.readPosition)

    this.readPosition += 8

    return value
  }

  /**
   * Reads a UTF-8 string
   * @returns {String}
   */
  readUTF() {
    const length = this.readUnsignedShort()
    const position = this.readPosition

    this.readPosition += length

    return this.buffer.toString("utf8", position, position + length)
  }

  /**
   * Reads an unsigned short
   * @returns {Number}
   */
  readUnsignedShort() {
    const value = this.buffer.readUInt16BE(this.readPosition)

    this.readPosition += 2

    return value
  }

  /**
   * Reads an unsigned int
   * @returns {Number}
   */
  readUnsignedInt() {
    const value = this.buffer.readUInt32BE(this.readPosition)

    this.readPosition += 4

    return value
  }

  /**
   * Reads multiple UTF-8 bytes
   * @param {Number} length
   * @returns {String}
   */
  readUTFBytes(length) {
    const position = this.readPosition

    this.readPosition += length

    return this.buffer.toString("utf8", position, position + length)
  }

  /**
   * Reads a signed short
   * @returns {Number}
   */
  readShort() {
    const value = this.buffer.readInt16BE(this.readPosition)

    this.readPosition += 2

    return value
  }

  /**
   * Reads an unsigned int29
   * @returns {Number}
   */
  readUInt29() {
    let result = 0
    let b = this.readUnsignedByte()

    if (b < 128) {
      return b
    }

    result = (b & 0x7f) << 7
    b = this.readUnsignedByte()

    if (b < 128) {
      return result | b
    }

    result = (result | (b & 0x7f)) << 7
    b = this.readUnsignedByte()

    if (b < 128) {
      return result | b
    }

    result = (result | (b & 0x7f)) << 8
    b = this.readUnsignedByte()

    return result | b
  }
}

module.exports = ByteArray
