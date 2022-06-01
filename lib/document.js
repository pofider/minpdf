const PDF = require('./object')
const { getObjectsRecursive } = require('./parser/parser')
const merge = require('./mixins/merge')
const append = require('./mixins/append')
const attachment = require('./mixins/attachment')
const outlines = require('./mixins/outlines')
const processText = require('./mixins/processText')
const acroForm = require('./mixins/acroform')

module.exports = class Document {
  constructor () {
    this._nextObjectId = 1
    this._length = 0 // keeps track of the total document length (in byte)
    this._xref = new PDF.Xref()

    this._chunks = []

    this.catalog = new PDF.Object('Catalog')
    this.catalog.prop('Pages', new PDF.Object('Pages').toReference())
    this.catalog.prop('Info', new PDF.Object('Info').toReference())

    this.catalog.properties.get('Pages').object.prop('MediaBox', new PDF.Array([0, 0, 595.296, 841.896]))
    this.catalog.properties.get('Pages').object.prop('Kids', new PDF.Array())
    this.catalog.properties.get('Pages').object.prop('Count', 0)

    this.catalog.prop('Names', new PDF.Object().toReference())

    this.catalog.prop('Dests', new PDF.Object().toReference())

    this.finalizers = []

    merge(this)
    append(this)
    attachment(this)
    outlines(this)
    processText(this)
    acroForm(this)
  }

  async asBuffer () {
    this._write('%PDF-1.6\n' +
      // The PDF format mandates that we add at least 4 commented binary characters
      // (ASCII value >= 128), so that generic tools have a chance to detect
      // that it's a binary file
      '%\xFF\xFF\xFF\xFF\n\n')
    // to support random access to individual objects, a PDF file
    // contains a cross-reference table that can be used to locate
    // and directly access pages and other important objects within the file

    this._registerObject(this.catalog)

    for (const fn of this.finalizers) {
      await fn()
    }

    const objects = getObjectsRecursive(this.catalog)
    for (const o of objects) {
      this._registerObject(o)
    }

    this._writeObject(this.catalog)

    for (const o of objects) {
      this._writeObject(o)
    }

    const startxref = this._length
    await this._write(this._xref.toString())

    // trailer
    const objectsCount = this._nextObjectId - 1

    // TOOD .object by mel aj na objektu vratit objekt? nebo to resit jinak
    const trailer = new PDF.Trailer(objectsCount + 1, this.catalog, this.catalog.properties.get('Info').object)
    await this._write(trailer.toString() + '\n')

    // startxref
    await this._write('startxref\n' + startxref + '\n%%EOF')

    return Buffer.concat(this._chunks)
  }

  _registerObject (object, force) {
    if (object instanceof PDF.Stream) {
      object = object.object
    }

    if (!force && object.id) {
      return
    }

    object.id = this._nextObjectId
    this._nextObjectId++
  }

  _writeObject (object, encrypt = true) {
    if (object instanceof PDF.Stream) {
      object = object.object
    }

    if (!object.id) {
      this._registerObject(object)
    }

    // TODO melo by to tady byt a nemelo by se to resit uplne jinak
    // pofider change, avoid duplicating objects (fonts for instance) to have smaller final pdf size
    if (this._xref.get(object.id)) {
      return
    }

    this._xref.add(object.id, {
      offset: this._length,
      obj: object
    })

    return this._write(object.toString() + '\n\n')
  }

  _write (chunk) {
    this._length += chunk.length
    this._chunks.push(Buffer.from(chunk, 'binary'))
  }
}
