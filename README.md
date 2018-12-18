# node-amf

[![Build Status](https://travis-ci.com/Zaseth/node-amf.svg?branch=master)](https://travis-ci.com/Zaseth/node-amf)

[![NPM Version](https://img.shields.io/npm/v/node-amf.svg)](https://www.npmjs.com/package/node-amf)

## Introduction

This is an AMF library supporting AMF0 and AMF3. It's written to be as accurate as possible to AMF in Actionscript.

## Installation

`npm install node-amf`

## Test & Usage

You can find tests in `/spec/` using `tape`.

A simple usage example:

```javascript
const AMF0 = require("node-amf")
const amf = new AMF() // AMF3

amf.writeData({ id: 1 })
amf.readData() // { id: 1 }

amf.version = 0 // AMF0

amf.writeData({ id: 1 })
amf.readData() // { id: 1 }
```

# Supported types

### AMF0

| Type         | Write | Read | Reason for exclusion                     |
| ------------ | ----- | ---- | ---------------------------------------- |
| Number       | ✔     | ✔    | -                                        |
| Boolean      | ✔     | ✔    | -                                        |
| String       | ✔     | ✔    | -                                        |
| Object       | ✔     | ✔    | -                                        |
| Null         | ✔     | ✔    | -                                        |
| Undefined    | ✔     | ✔    | -                                        |
| Reference    | ✔     | ✔    | -                                        |
| ECMA array   | ✔     | ✔    | -                                        |
| Strict array | ✗     | ✔    | AMF0 standards to ECMA array for writing |
| Date         | ✔     | ✔    | -                                        |
| Long string  | ✔     | ✔    | -                                        |
| XML document | ✗     | ✗    | Who needs XML?                           |
| Typed object | ✔     | ✔    | -                                        |

### AMF3

| Type         | Write | Read | Reason for exclusion |
| ------------ | ----- | ---- | -------------------- |
| Undefined    | ✔     | ✔    | -                    |
| Null         | ✔     | ✔    | -                    |
| Boolean      | ✔     | ✔    | -                    |
| Integer      | ✔     | ✔    | -                    |
| Double       | ✔     | ✔    | -                    |
| String       | ✔     | ✔    | -                    |
| XML document | ✗     | ✗    | Who needs XML?       |
| Date         | ✔     | ✔    | -                    |
| Array        | ✔     | ✔    | -                    |
| Object       | ✔     | ✔    | -                    |
| XML          | ✗     | ✗    | Who needs XML?       |
| ByteArray    | ✔     | ✔    | -                    |
| Vector       | ✗     | ✗    | No type in JS        |
| Dictionary   | ✗     | ✗    | No type in JS        |
