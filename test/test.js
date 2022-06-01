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

  it('should outlines', async () => {
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

  it('should processText', async () => {
    const document = new Document()
    const external = new External(await fs.readFile(path.join(__dirname, 'main.pdf')))
    document.append(external)
    document.processText({
      resolver: (text, { remove, position }) => {
        remove(0, text.length)
        console.log(position(0, text.length))
      }
    })
    const pdfBuffer = await document.asBuffer()
    await fs.writeFile('out.pdf', pdfBuffer)
  })

  it('should acroform', async () => {
    const document = new Document()
    const external = new External(await fs.readFile(path.join(__dirname, 'main.pdf')))
    document.append(external)
    document.processText({
      resolver: async (text, { remove, getPosition }) => {
        remove(0, text.length)
        const { pageIndex, position } = getPosition(0, text.length)

        await document.acroForm({
          name: 'foo',
          width: 100,
          height: 20,
          position,
          pageIndex,
          fontSize: 10,
          type: 'text'
        })
      }
    })
    const pdfBuffer = await document.asBuffer()
    await fs.writeFile('out.pdf', pdfBuffer)
  })

  it('should info', async () => {
    const document = new Document()
    const external = new External(await fs.readFile(path.join(__dirname, 'main.pdf')))
    document.append(external)
    document.info({
      creationDate: new Date(2021, 2, 2),
      title: 'Hello world šš'
    })
    const pdfBuffer = await document.asBuffer()
    await fs.writeFile('out.pdf', pdfBuffer)
  })

  it('should encrypt', async () => {
    const document = new Document()
    const external = new External(await fs.readFile(path.join(__dirname, 'main.pdf')))
    document.append(external)
    document.encrypt({
      password: 'password',
      ownerPassword: 'password'
    })
    const pdfBuffer = await document.asBuffer()
    await fs.writeFile('out.pdf', pdfBuffer)
  })

  it.only('should sign', async () => {
    const document = new Document()
    const external = new External(await fs.readFile(path.join(__dirname, 'main.pdf')))
    document.append(external)
    document.sign({
      certificateBuffer: await fs.readFile(path.join(__dirname, 'certificate.p12')),
      password: 'node-signpdf',
      reason: 'some reason'
    })
    const pdfBuffer = await document.asBuffer()
    await fs.writeFile('out.pdf', pdfBuffer)
  })
})
