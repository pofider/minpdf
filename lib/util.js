const zlib = require('zlib')

module.exports.inflate = (obj) => {
  return zlib.unzipSync(obj.content.content).toString('latin1')
}

exports.toArrayBuffer = function (b) {
  if (b instanceof ArrayBuffer) {
    return b
  } else {
    return b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength)
  }
}
