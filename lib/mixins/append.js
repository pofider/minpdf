module.exports = (doc) => {
  doc.append = (ext, pageNumbers) => doc.finalizers.push(() => append(ext, doc, pageNumbers))
}

function append (ext, doc, pageNumbers) {
  const pages = ext.catalog.properties.get('Pages').object.properties.get('Kids').map(kid => kid.object)
  for (let i = 0; i < pages.length; i++) {
    const page = pages[i]

    if (pageNumbers == null || pageNumbers.includes(i)) {
      page.prop('Parent', doc.catalog.properties.get('Pages'))
      doc.catalog.properties.get('Pages').object.prop('Count', doc.catalog.properties.get('Pages').object.properties.get('Count') + 1)
      doc.catalog.properties.get('Pages').object.properties.get('Kids').push(page.toReference())
    }
  }

  // todo shouldn't we merge the values there? and do the same also in the merge?
  if (ext.catalog.properties.get('Dests')) {
    doc.catalog.prop('Dests', ext.catalog.properties.get('Dests'))
  }
}
