"use strict"

const it = require("tape")
const AMF = require("../../src/AMF")

it("Can write/read null and undefined", (tape) => {
  const amf = new AMF(0)

  amf.writeData(null)
  amf.writeData(undefined)
  tape.equal(amf.readData(), null)
  tape.equal(amf.readData(), undefined)

  tape.end()
})

it("Can write/read a double and a number", (tape) => {
  const amf = new AMF(0)

  amf.writeData(5.11)
  amf.writeData(5)
  amf.writeData(100.12)
  amf.writeData(Math.PI)
  tape.equal(amf.readData(), 5.11)
  tape.equal(amf.readData(), 5)
  tape.equal(amf.readData(), 100.12)
  tape.equal(amf.readData(), Math.PI)

  tape.end()
})

it("Can write/read a boolean", (tape) => {
  const amf = new AMF(0)

  amf.writeData(true)
  amf.writeData(false)
  tape.equal(amf.readData(), true)
  tape.equal(amf.readData(), false)

  tape.end()
})

it("Can write/read a string", (tape) => {
  const amf = new AMF(0)

  amf.writeData("Hello")
  amf.writeData("World")
  tape.equal(amf.readData(), "Hello")
  tape.equal(amf.readData(), "World")

  tape.end()
})

it("Can write/read an object", (tape) => {
  const amf = new AMF(0)

  amf.writeData({ id: 1, a: [1, 2, "a"], b: { c: 1 } })
  tape.deepEqual(amf.readData(), { id: 1, a: { "0": 1, "1": 2, "2": "a" }, b: { c: 1 } })

  tape.end()
})

it("Can write/read an ECMA array", (tape) => {
  const amf = new AMF(0)

  amf.writeData([1, 2, 3])
  amf.writeData(["a", "b", "c"])
  amf.writeData([null, true, false, undefined])

  tape.deepEqual(amf.readData(), { "0": 1, "1": 2, "2": 3 })
  tape.deepEqual(amf.readData(), { "0": "a", "1": "b", "2": "c" })
  tape.deepEqual(amf.readData(), { "0": null, "1": true, "2": false, "3": undefined })

  tape.end()
})

it("Can write/read a typed object", (tape) => {
  const amf = new AMF(0)

  class Person {
    constructor() {
      this.first = ""
      this.last = ""
      this.age = 0
    }
  }

  const person = new Person()

  // Turns it into an object
  person.first = "Zaseth"
  person.last = "Secret"
  person.age = 16

  amf.writeData(person)
  tape.deepEqual(amf.readData(), { "@name": "Person", first: "Zaseth", last: "Secret", age: 16 })

  tape.end()
})

it("Can detect a reference", (tape) => {
  const amf = new AMF(0)

  const value = { id: 1 }

  amf.writeData(value)
  tape.deepEqual(amf.references, [{ id: 1 }])
  tape.deepEqual(amf.buffer.writePosition, 17)

  amf.writeData(value) // Creates the reference
  tape.deepEqual(amf.references, [{ id: 1 }])
  tape.deepEqual(amf.buffer.writePosition, 20) // Reference marker + Reference index (int8 + uint16)

  tape.deepEqual(amf.readData(), { id: 1 })
  tape.deepEqual(amf.buffer.readPosition, 17) // The reference is only 3 bytes
  tape.deepEqual(amf.readData(), { id: 1 })

  tape.end()
})

it("Can write/read a date", (tape) => {
  const amf = new AMF()

  amf.writeData(new Date(2001, 25, 12))

  tape.same(amf.readData(), new Date(2001, 25, 12))

  tape.end()
})
