const PDF = require('../object')
const zlib = require('zlib')
const { createHash } = require('crypto')

module.exports = (doc) => {
  doc.catalog.properties.get('Names').object.prop('EmbeddedFiles', new PDF.Dictionary())
  doc.catalog.properties.get('Names').object.properties.get('EmbeddedFiles').set('Names', new PDF.Array())

  doc.attachment = (buffer, options) => doc.finalizers.push(() => attachment(buffer, doc, options))
}

function attachment (buffer, doc, { name, description, creationDate, modificationDate }) {
  const fileSpec = new PDF.Object()
  fileSpec.prop('Type', 'Filespec')
  fileSpec.prop('F', new PDF.String(name))
  if (description) {
    fileSpec.prop('Desc', new PDF.String(description))
  }

  const streamObject = new PDF.Object()
  const embeddedFile = new PDF.Stream(streamObject)
  embeddedFile.object.prop('Filter', 'FlateDecode')
  embeddedFile.object.prop('Type', 'EmbeddedFile')
  embeddedFile.content = zlib.deflateSync(buffer)
  embeddedFile.object.prop('Length', embeddedFile.content.length)

  const params = new PDF.Dictionary()
  embeddedFile.object.prop('Params', params)
  params.set('Size', buffer.byteLength)

  const checksum = createHash('md5')
    .update(buffer)
    .digest('hex')
  params.set('CheckSum', new PDF.String(checksum))

  if (creationDate) {
    params.set('CreationDate', new PDF.String(formatDate(creationDate)))
  }
  if (modificationDate) {
    params.set('ModDate', new PDF.String(formatDate(modificationDate)))
  }

  const efDictionary = new PDF.Dictionary()
  efDictionary.set('F', streamObject.toReference())
  fileSpec.prop('EF', efDictionary)

  doc.catalog.properties.get('Names').object.properties.get('EmbeddedFiles').get('Names').push(
    new PDF.String(name),
    fileSpec.toReference()
  )
}

function formatDate (date) {
  let str = 'D:' +
        date.getFullYear() +
        ('00' + (date.getMonth() + 1)).slice(-2) +
        ('00' + date.getDate()).slice(-2) +
        ('00' + date.getHours()).slice(-2) +
        ('00' + date.getMinutes()).slice(-2) +
        ('00' + date.getSeconds()).slice(-2)

  let offset = date.getTimezoneOffset()
  const rel = offset === 0 ? 'Z' : (offset > 0 ? '-' : '+')
  offset = Math.abs(offset)
  const hoursOffset = Math.floor(offset / 60)
  const minutesOffset = offset - hoursOffset * 60

  str += rel +
        ('00' + hoursOffset).slice(-2) + '\'' +
        ('00' + minutesOffset).slice(-2) + '\''

  return str
}
