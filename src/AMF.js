"use strict"

const ByteArray = require("./ByteArray")

/**
 * Contains all of the supported AMF markers
 * @constant Markers
 * @type {Object}
 */
const Markers = {
  AMF0: {
    NUMBER: 0,
    BOOLEAN: 1,
    STRING: 2,
    OBJECT: 3,
    NULL: 5,
    UNDEFINED: 6,
    REFERENCE: 7,
    ECMA_ARRAY: 8,
    OBJECT_END: 9,
    STRICT_ARRAY: 10,
    DATE: 11,
    LONG_STRING: 12,
    TYPED_OBJECT: 16,
    AVMPLUS: 17
  },
  AMF3: {
    UNDEFINED: 0,
    NULL: 1,
    FALSE: 2,
    TRUE: 3,
    INTEGER: 4,
    DOUBLE: 5,
    STRING: 6,
    DATE: 8,
    ARRAY: 9,
    OBJECT: 10,
    BYTE_ARRAY: 12
  }
}

/**
 * AMF class
 * @author Zaseth
 */
class AMF {
  constructor(version = 3) {
    if (version !== 0 && version !== 3) {
      throw new TypeError(`AMF.constructor => Unknown AMF version: ${version}`)
    }

    // AMF
    this.buffer = new ByteArray()
    this.version = version
    this.useTraitRef = false
    this.byteBit = []

    // AMF0
    this.references = []

    // AMF3
    this.objects = []
    this.strings = []
  }

  /**
   * A simple function to validate values
   * @param {Number} expected
   * @param {Number} actual
   */
  assert(expected, actual) {
    if (expected !== actual) {
      throw new Error(`AMF.assert => Expected: "${expected}" but got: "${actual}"`)
    }
  }

  /**
   * Checks if the AMF3 array is dense
   * @param {Array} array
   * @returns {Boolean}
   */
  isDense(arr) {
    if (!arr) {
      return true
    }

    let count = 0

    for (const idx in arr) {
      if (idx != count) {
        return false
      }

      count++
    }

    return true
  }

  /**
   * Writes an AMF value
   * @param {Any} value
   * @param {Boolean} withReference
   */
  writeData(value, withReference = false) {
    const type = typeof value

    if (value === undefined) {
      this.buffer.writeByte(this.version === 0 ? Markers.AMF0.UNDEFINED : Markers.AMF3.UNDEFINED)
    } else if (value === null) {
      this.buffer.writeByte(this.version === 0 ? Markers.AMF0.NULL : Markers.AMF3.NULL)
    } else if (type === "boolean") {
      if (this.version === 0) {
        this.buffer.writeByte(Markers.AMF0.BOOLEAN)
        this.buffer.writeByte(Number(value))
      } else {
        this.buffer.writeByte(value ? Markers.AMF3.TRUE : Markers.AMF3.FALSE)
      }
    } else if (type === "number") {
      if (this.version === 0) {
        this.buffer.writeByte(Markers.AMF0.NUMBER)
        this.buffer.writeDouble(value)
      } else {
        this.writeInteger(value)
      }
    } else if (type === "string") {
      this.buffer.writeByte(this.version === 0 ? Markers.AMF0.STRING : Markers.AMF3.STRING)
      this.writeString(value, withReference)
    } else if (type === "object") {
      const func = value.constructor

      if (func === Date) {
        this.writeDate(value)
      } else if (func === Array) {
        this.version === 0 ? this.writeECMAArray(value) : this.writeArray(value)
      } else if (func === Object) {
        this.writeObject(value)
      } else if (func === Buffer && this.version === 3) {
        this.writeByteArray(value)
      } else if (![Number, String].includes(func) && this.version === 0) {
        this.writeTypedObject(value)
      } else {
        throw new TypeError(`AMF.writeData => Unsupported custom class detected: ${value.constructor.name}`)
      }
    } else {
      throw new TypeError(`AMF.writeData => Unknown value type: ${type}`)
    }
  }

  /**
   * Reads an AMF value
   * @returns {Any}
   */
  readData() {
    const marker = this.buffer.readByte()

    if (this.version === 0) {
      if (marker === Markers.AMF0.NUMBER) {
        return this.buffer.readDouble()
      } else if (marker === Markers.AMF0.BOOLEAN) {
        return Boolean(this.buffer.readByte())
      } else if (marker === Markers.AMF0.STRING) {
        return this.readString()
      } else if (marker === Markers.AMF0.OBJECT) {
        return this.readObject()
      } else if (marker === Markers.AMF0.NULL) {
        return null
      } else if (marker === Markers.AMF0.UNDEFINED) {
        return undefined
      } else if (marker === Markers.AMF0.REFERENCE) {
        return this.references[this.buffer.readUnsignedShort()]
      } else if (marker === Markers.AMF0.ECMA_ARRAY) {
        return this.readECMAArray()
      } else if (marker === Markers.AMF0.STRICT_ARRAY) {
        return this.readStrictArray()
      } else if (marker === Markers.AMF0.DATE) {
        return this.readDate()
      } else if (marker === Markers.AMF0.LONG_STRING) {
        return this.buffer.readUTFBytes(this.buffer.readUnsignedInt())
      } else if (marker === Markers.AMF0.TYPED_OBJECT) {
        return this.readTypedObject()
      } else if (marker === Markers.AMF0.AVMPLUS) {
        this.version = 3

        return this.readData()
      } else {
        throw new TypeError(`AMF.readData => Unknown AMF0 marker: ${marker}`)
      }
    } else {
      if (this.byteBit.length > 0) {
        // Peek over the ByteArray marker
        this.buffer.readPosition += this.byteBit[0] - 1

        // The first ByteArray marker
        if (this.buffer.readByte() === Markers.AMF3.BYTE_ARRAY) {
          // Undo our peek
          this.buffer.readPosition -= this.byteBit[0] + 1

          return this.readByteArray()
        }
      } else if (marker === Markers.AMF3.UNDEFINED) {
        return undefined
      } else if (marker === Markers.AMF3.NULL) {
        return null
      } else if (marker === Markers.AMF3.FALSE) {
        return false
      } else if (marker === Markers.AMF3.TRUE) {
        return true
      } else if (marker === Markers.AMF3.INTEGER) {
        return (this.buffer.readUInt29() << 3) >> 3
      } else if (marker === Markers.AMF3.DOUBLE) {
        return this.buffer.readDouble()
      } else if (marker === Markers.AMF3.STRING) {
        return this.readString()
      } else if (marker === Markers.AMF3.DATE) {
        return this.readDate()
      } else if (marker === Markers.AMF3.ARRAY) {
        return this.readArray()
      } else if (marker === Markers.AMF3.OBJECT) {
        return this.readObject()
      } else {
        throw new TypeError(`AMF.readData => Unknown AMF3 marker: ${marker}`)
      }
    }
  }

  /**
   * Writes an AMF3 integer
   * @param {Number} value
   */
  writeInteger(value) {
    // Check if the number is safe
    const isSafe = (value) => -Math.pow(2, 28) <= value && value <= +Math.pow(2, 28) - 1

    // Number.isInteger is used to detect a double value
    if (Number.isInteger(value) && isSafe(value)) {
      this.buffer.writeByte(Markers.AMF3.INTEGER)
      this.buffer.writeUInt29(value & 0x1fffffff)
    } else {
      this.buffer.writeByte(Markers.AMF3.DOUBLE)
      this.buffer.writeDouble(value)
    }
  }

  /**
   * Writes an AMF string
   * @param {String} value
   * @param {Boolean} withReference
   */
  writeString(value, withReference = false) {
    if (this.version === 0) {
      const length = Buffer.byteLength(value)

      if (length <= 65535) {
        this.buffer.writeUTF(value)
      } else {
        this.writeLongString(value)
      }
    } else {
      if (value.length === 0) {
        return this.buffer.writeUInt29((0 << 1) | 1)
      }

      // Object keys can use a reference
      if (withReference) {
        const idx = this.strings.indexOf(value)

        if (idx >= 0) {
          return this.buffer.writeUInt29((idx << 1) | 0)
        }

        this.strings.push(value)
      }

      this.buffer.writeUInt29((value.length << 1) | 1)
      this.buffer.writeUTFBytes(value)
    }
  }

  /**
   * Reads an AMF string
   * @returns {String}
   */
  readString() {
    if (this.version === 0) {
      return this.buffer.readUTF()
    } else {
      const idx = this.buffer.readUInt29()

      if ((idx & 1) === 0) {
        return this.strings[idx >> 1]
      }

      const value = this.buffer.readUTFBytes(idx >> 1)

      // Support empty strings
      return value.length === 0 ? "" : value
    }
  }

  /**
   * Writes an AMF date
   * @param {Date} value
   */
  writeDate(value) {
    if (this.version === 0) {
      this.buffer.writeByte(Markers.AMF0.DATE)
      this.buffer.writeDouble(value.getTime())
      this.buffer.writeShort(value.getTimezoneOffset())
    } else {
      const idx = this.objects.indexOf(value)

      if (idx >= 0) {
        return this.buffer.writeUInt29((idx << 1) | 0)
      }

      this.objects.push(value)

      this.buffer.writeByte(Markers.AMF3.DATE)
      this.buffer.writeUInt29((0 << 1) | 1)
      this.buffer.writeDouble(value.getTime())
    }
  }

  /**
   * Reads an AMF date
   * @returns {Date}
   */
  readDate() {
    if (this.version === 0) {
      const date = new Date(this.buffer.readDouble())

      this.buffer.readShort()

      return date
    } else {
      const idx = this.buffer.readUInt29()

      if ((idx & 1) === 0) {
        return this.objects[idx >> 1]
      }

      return new Date(this.buffer.readDouble())
    }
  }

  /**
   * Writes an AMF3 array
   * @param {Array} value
   */
  writeArray(value) {
    const idx = this.objects.indexOf(value)

    if (idx >= 0) {
      return this.buffer.writeUInt29((idx << 1) | 0)
    }

    this.objects.push(value)

    this.buffer.writeByte(Markers.AMF3.ARRAY)

    if (this.isDense(value)) {
      this.buffer.writeUInt29((value.length << 1) | 1)
      this.writeString("")

      for (const i in value) {
        this.writeData(value[i])
      }
    } else {
      this.buffer.writeUInt29((0 << 1) | 0)

      for (const key in value) {
        this.writeString(key)
        this.writeData(value[key])
      }

      this.writeString("")
    }
  }

  /**
   * Reads an AMF3 array
   * @returns {Array}
   */
  readArray() {
    const idx = this.buffer.readUInt29()

    if ((idx & 1) === 0) {
      return this.objects[idx >> 1]
    }

    let key = this.readString()

    if (key === "") {
      const value = []

      for (let i = 0; i < idx >> 1; i++) {
        value[i] = this.readData()
      }

      return value
    }

    const value = {}

    while (key !== "") {
      value[key] = this.readData()
      key = this.readString()
    }

    for (let i = 0; i < idx >> 1; i++) {
      value[i] = this.readData()
    }

    return value
  }

  /**
   * Writes an AMF object
   * @param {Object} value
   */
  writeObject(value) {
    if (this.version === 0) {
      const idx = this.references.indexOf(value)

      if (idx >= 0) {
        return this.writeReference(idx)
      }

      this.references.push(value)

      this.buffer.writeByte(Markers.AMF0.OBJECT)

      for (const key in value) {
        this.writeString(key)
        this.writeData(value[key])
      }

      this.buffer.writeUnsignedShort(0)
      this.buffer.writeByte(Markers.AMF0.OBJECT_END)
    } else {
      const idx = this.objects.indexOf(value)

      if (idx >= 0) {
        return this.buffer.writeUInt29((idx << 1) | 0)
      }

      this.objects.push(value)

      this.buffer.writeByte(Markers.AMF3.OBJECT)
      /**
       * We don't support any trait properties
       * 11 calculates to: 0 << 4 | 1 << 3 | 0 << 2 | 3
       * This number is a reference
       */
      if (this.useTraitRef) {
        this.useTraitRef = false

        this.buffer.writeUInt29(11)
      }

      this.writeString("") // Class name

      for (const key in value) {
        this.writeString(key, true)
        this.writeData(value[key], true)
      }

      this.writeString("")
    }
  }

  /**
   * Reads an AMF object
   * @returns {Object}
   */
  readObject() {
    if (this.version === 0) {
      const value = {}

      for (let key = this.readString(); key !== ""; key = this.readString()) {
        value[key] = this.readData()
      }

      this.assert(Markers.AMF0.OBJECT_END, this.buffer.readByte())

      return value
    } else {
      const idx = this.buffer.readUInt29()

      if ((idx & 1) === 0) {
        return this.objects[idx >> 1]
      }

      /**
       * Validate trait properties
       * When an object is written twice, the trait UINT29 marker 11 gets removed
       * We support this down here
       */
      this.assert(this.useTraitRef ? false : true, (idx & 3) === 1) // Trait reference
      this.assert(false, (idx & 4) === 4) // Externalizable
      this.assert(this.useTraitRef ? true : false, (idx & 8) === 8) // Dynamic

      // This will read the object key if useTraitRef is false
      if (this.useTraitRef) {
        this.assert("", this.readString()) // Class name
      }

      const value = {}

      for (let key = this.readString(); key !== ""; key = this.readString()) {
        value[key] = this.readData()
      }

      return value
    }
  }

  /**
   * Writes an AMF0 reference
   * @param {Number} idx
   */
  writeReference(idx) {
    if (idx <= 65535) {
      this.buffer.writeByte(Markers.AMF0.REFERENCE)
      this.buffer.writeUnsignedShort(idx)
    }
  }

  /**
   * Writes an AMF0 ECMA array
   * @param {Array} value
   */
  writeECMAArray(value) {
    const idx = this.references.indexOf(value)

    if (idx >= 0) {
      return this.writeReference(idx)
    }

    this.references.push(value)

    this.buffer.writeByte(Markers.AMF0.ECMA_ARRAY)
    this.buffer.writeUnsignedInt(value.length)

    // The associative part
    for (const key in value) {
      this.writeString(key)
      this.writeData(value[key])
    }

    this.buffer.writeUnsignedShort(0)
    this.buffer.writeByte(Markers.AMF0.OBJECT_END)
  }

  /**
   * Reads an AMF0 ECMA array
   * @returns {Object}
   */
  readECMAArray() {
    const value = {}
    const length = this.buffer.readUnsignedInt()

    for (let key = this.readString(); key !== "" && length !== 0; key = this.readString()) {
      value[key] = this.readData()
    }

    this.assert(Markers.AMF0.OBJECT_END, this.buffer.readByte())

    return value
  }

  /**
   * Reads an AMF0 strict array
   * @returns {Array}
   */
  readStrictArray() {
    const value = []
    const length = this.buffer.readUnsignedInt()

    for (let i = 0; i < length; i++) {
      value[i] = this.readData()
    }

    return value
  }

  /**
   * Writes an AMF0 long string
   * @param {String} value
   */
  writeLongString(value) {
    const length = Buffer.byteLength(value)

    if (length <= 65535) {
      this.writeString(value)
    } else {
      this.buffer.writeByte(Markers.AMF0.LONG_STRING)
      this.buffer.writeUnsignedInt(length)
      this.buffer.writeUTFBytes(value)
    }
  }

  /**
   * Writes an AMF0 typed object
   * @param {Object} value
   */
  writeTypedObject(value) {
    const idx = this.references.indexOf(value)

    if (idx >= 0) {
      return this.writeReference(idx)
    }

    this.references.push(value)

    this.buffer.writeByte(Markers.AMF0.TYPED_OBJECT)
    this.writeString(value.constructor.name)

    for (const key in value) {
      this.writeString(key)
      this.writeData(value[key])
    }

    this.buffer.writeUnsignedShort(0)
    this.buffer.writeByte(Markers.AMF0.OBJECT_END)
  }

  /**
   * Reads an AMF0 typed object
   * @returns {Object}
   */
  readTypedObject() {
    const value = {
      "@name": this.readString()
    }

    for (let key = this.readString(); key !== ""; key = this.readString()) {
      value[key] = this.readData()
    }

    this.assert(Markers.AMF0.OBJECT_END, this.buffer.readByte())

    return value
  }

  /**
   * Writes an AMF3 ByteArray
   * @param {Buffer} value
   */
  writeByteArray(value) {
    const idx = this.objects.indexOf(value)

    if (idx >= 0) {
      return this.buffer.writeUInt29((idx << 1) | 0)
    }

    this.objects.push(value)

    // Copy the bytes into the buffer
    for (let i = 0; i < value.length; i++) {
      this.buffer.writeByte(value.readInt8(i))
    }

    // Store the marker position
    this.byteBit[0] = this.buffer.writePosition

    this.buffer.writeByte(Markers.AMF3.BYTE_ARRAY)

    // Store the UINT29 position
    this.byteBit[1] = this.buffer.writePosition

    // + 1 because of the ByteArray marker
    this.buffer.writeUInt29(((value.length + 1) << 1) | 1)

    // Copy the bytes into the buffer again
    for (let i = 0; i < value.length; i++) {
      this.buffer.writeByte(value[i])
    }

    this.buffer.writeByte(Markers.AMF3.BYTE_ARRAY)
  }

  /**
   * Reads an AMF3 ByteArray
   * @returns {Buffer}
   */
  readByteArray() {
    // Increment to read the UINT29
    this.buffer.readPosition += this.byteBit[1]

    // Reset it
    this.byteBit = []

    const idx = this.buffer.readUInt29()

    if ((idx & 1) === 0) {
      return this.objects[idx >> 1]
    }

    const value = []

    // Read the bytes until the end
    for (let i = 0; i < idx >> 1; i++) {
      value[i] = this.buffer.readByte()
    }

    // Remove the ByteArray marker with a check
    if (value.pop() === Markers.AMF3.BYTE_ARRAY) {
      return Buffer.from(value)
    } else {
      throw new RangeError(`AMF.readByteArray => No ByteArray end marker found`)
    }
  }
}

module.exports = AMF
