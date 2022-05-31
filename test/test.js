const { Document, External } = require('../')
const fs = require('fs/promises')
const path = require('path')

function validatePdf (src) {

}

describe('minpdf', () => {
  it('should work', async () => {
    const document = new Document()
    const external = new External(await fs.readFile(path.join(__dirname, 'test.pdf')))
    document.addPagesOf(external)
    const external2 = new External(await fs.readFile(path.join(__dirname, 'test.pdf')))
    document.addPagesOf(external2)
    const pdfBuffer = await document.asBuffer()
    console.log(pdfBuffer.toString())
    await fs.writeFile('out.pdf', pdfBuffer)
  })

  it('should work merge', async () => {
    const document = new Document()
    const external = new External(await fs.readFile(path.join(__dirname, 'main.pdf')))
    document.append(external)
    const external2 = new External(await fs.readFile(path.join(__dirname, 'header.pdf')))
    document.merge(external2)
    const pdfBuffer = await document.asBuffer()
    console.log(pdfBuffer.toString())
    await fs.writeFile('out.pdf', pdfBuffer)
  })

  it('should attachment', async () => {
    const document = new Document()
    const external = new External(await fs.readFile(path.join(__dirname, 'main.pdf')))
    document.append(external)
    document.attachment(await fs.readFile(path.join(__dirname, 'main.pdf')), { name: 'myattachmennt.pdf' })
    const pdfBuffer = await document.asBuffer()
    console.log(pdfBuffer.toString())
    await fs.writeFile('out.pdf', pdfBuffer)
  })

  it.only('should outlines', async () => {
    const document = new Document()
    const external = new External(await fs.readFile(path.join(__dirname, 'links.pdf')))
    document.append(external)
    document.outlines([{
      title: 'some title',
      id: '1'
    }])
    const pdfBuffer = await document.asBuffer()
    console.log(pdfBuffer.toString())
    await fs.writeFile('out.pdf', pdfBuffer)
  })
})
