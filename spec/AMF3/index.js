"use strict"

const it = require("tape")
const AMF = require("../../src/AMF")

it("Can write/read null and undefined", (tape) => {
  const amf = new AMF()

  amf.writeData(null)
  amf.writeData(undefined)
  tape.equal(amf.readData(), null)
  tape.equal(amf.readData(), undefined)

  tape.end()
})

it("Can write/read a double and a number", (tape) => {
  const amf = new AMF()

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
  const amf = new AMF()

  amf.writeData(true)
  amf.writeData(false)
  tape.equal(amf.readData(), true)
  tape.equal(amf.readData(), false)

  tape.end()
})

it("Can write/read a string", (tape) => {
  const amf = new AMF()

  amf.writeData("Hello")
  amf.writeData("World")
  tape.equal(amf.readData(), "Hello")
  tape.equal(amf.readData(), "World")

  tape.end()
})

it("Can write/read an object", (tape) => {
  const amf = new AMF()

  amf.writeData({ id: 1, a: [1, 2, "a"], b: { c: 1 } })
  tape.deepEqual(amf.readData(), { id: 1, a: [1, 2, "a"], b: { c: 1 } })

  tape.end()
})

it("Can write/read an array", (tape) => {
  const amf = new AMF()

  amf.writeData([1, 2, 3])
  amf.writeData(["a", "b", "c"])
  amf.writeData([null, true, false, undefined])

  tape.deepEqual(amf.readData(), [1, 2, 3])
  tape.deepEqual(amf.readData(), ["a", "b", "c"])
  tape.deepEqual(amf.readData(), [null, true, false, undefined])

  tape.end()
})

it("Can write/read a complex array", (tape) => {
  const amf = new AMF()

  amf.writeData([{ id: 1 }, { id: 2 }, { id: 3 }])

  tape.deepEqual(amf.readData(), [{ id: 1 }, { id: 2 }, { id: 3 }])

  tape.end()
})

it("Can detect a trait reference", (tape) => {
  const amf = new AMF()

  amf.writeData([{ a: 1 }, { a: 1 }])

  tape.deepEqual(amf.readData(), [{ a: 1 }, { a: 1 }])

  tape.end()
})

it("Can write/read a ByteArray/Buffer", (tape) => {
  const amf = new AMF()

  amf.writeData(Buffer.from([1, 2, 3]))

  tape.deepEqual(amf.readData(), Buffer.from([1, 2, 3]))

  tape.end()
})

it("Can write/read a date", (tape) => {
  const amf = new AMF()

  amf.writeData(new Date(2001, 25, 12))

  tape.same(amf.readData(), new Date(2001, 25, 12))

  tape.end()
})
